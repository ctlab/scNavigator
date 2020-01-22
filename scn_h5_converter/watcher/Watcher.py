import logging
import pymongo
import pymongo.errors
import asyncio
import os

from hachiko import hachiko
from pathlib import Path
from datetime import datetime
from datetime import timedelta
from asyncio import Queue

from watcher.EventHandler import EventHandler, ChangeType
from watcher.WatcherArgs import parser
from watcher.MongoDBRoutines import remove_dataset, insert_dataset

TIMEDELTA_THRESHOLD = 10
SUFFIX_TO_WATCH = ".h5ad"

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

args = parser.parse_args()


async def worker(async_queue: Queue,
                 out_dir: str,
                 collection: pymongo.collection.Collection):
    while True:
        change = await async_queue.get()
        if change.type == ChangeType.MODIFIED:
            insert_dataset(change.file, out_dir, collection)
        elif change.type == ChangeType.DELETED:
            remove_dataset(change.file, out_dir, collection)


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

    asyncio.create_task(worker(async_queue, args.OUTDIR, collection))

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
