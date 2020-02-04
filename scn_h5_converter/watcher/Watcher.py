import logging
import pymongo
import pymongo.errors
import asyncio
import os

from hachiko import hachiko
from pathlib import Path
from datetime import datetime

from asyncio import Queue


from watcher.EventHandler import EventHandler, ChangeType
from watcher.WatcherArgs import parser
from watcher.MongoDBRoutines import remove_dataset, insert_dataset
from functools import partial

TIMEDELTA_THRESHOLD = 10
SUFFIX_TO_WATCH = ".h5ad"

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

args = parser.parse_args()

FUNCTION_MAPPING = {
    ChangeType.MODIFIED: insert_dataset,
    ChangeType.DELETED: remove_dataset
}


async def worker(async_queue: Queue,
                 out_dir: str,
                 gmt_dir: str,
                 collection: pymongo.collection.Collection,
                 processes: int = 4):
    while True:
        changes = list()
        changes.append(await async_queue.get())
        while len(changes) <= processes:
            if async_queue.qsize() > 0:
                changes.append(await async_queue.get())
            else:
                break

        functions = map(lambda x: partial(FUNCTION_MAPPING[x.type], path_to_dataset = x.file), changes)
        await asyncio.gather(*map(lambda fun: fun(out_dir=out_dir, gmt_dir=gmt_dir, collection=collection), functions))


async def main():
    client = pymongo.MongoClient(args.MONGODBHOST)
    database = client.get_database(args.MONGODATABASE)

    if args.MONGODBCOLLECTION not in database.list_collection_names():
        logging.info("Initializing MongoDB for the first time")
        collection = database.get_collection(args.MONGODBCOLLECTION)
        collection.create_index([("token", pymongo.ASCENDING),
                                 ("selfPath", pymongo.ASCENDING)], unique=True)
    else:
        collection = database.get_collection(args.MONGODBCOLLECTION)

    path = args.DIRECTORY

    files_being_watched = {}
    lock = asyncio.locks.Lock()

    event_handler = EventHandler(SUFFIX_TO_WATCH, files_being_watched, lock)
    watch_dog = hachiko.AIOWatchdog(path, True, event_handler)
    watch_dog.start()

    async_queue = Queue()
    asyncio.create_task(worker(async_queue, args.OUTDIR, args.GMTDIR, collection, 4))

    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(SUFFIX_TO_WATCH):
                Path(os.path.join(root, file)).touch()

    try:
        while True:
            await asyncio.sleep(20)
            async with lock:
                changes = [last_change for last_change in files_being_watched.values()
                           if (datetime.now() - last_change.when).seconds > TIMEDELTA_THRESHOLD]
                changes.sort(key=lambda x: x.when)
                for change in changes:
                    del files_being_watched[change.file]
                    async_queue.put_nowait(change)

    except KeyboardInterrupt:
        watch_dog.stop()

if __name__ == "__main__":
    asyncio.run(main())
