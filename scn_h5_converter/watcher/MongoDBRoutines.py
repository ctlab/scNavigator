import logging
import pymongo
import pymongo.errors
import os

from typing import Dict
from converter.H5Dataset import H5Dataset
from converter.Exceptions import H5DatasetInvalidException
from converter.Utils import rm_rf
import asyncio

from converter.Constants import MARKERS_ANNOTATION_FILE, ALLOWED_SPECIES, MARKERS_GMT_SUFFIX


async def run_cmd(cmd: str) -> None:
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE)

    stdout, stderr = await proc.communicate()


async def modules_merger(out_dir: str, gmt_dir: str) -> None:
    find_command = f'find "{out_dir}" | grep {MARKERS_ANNOTATION_FILE} | xargs -i echo \"{{}}\"'
    cmd_jq = f'jq -s add `{find_command}` > "{gmt_dir}/annotation.json"'
    await run_cmd(cmd_jq)

    for species in ALLOWED_SPECIES.keys():
        find_command = f'find "{out_dir}" | grep {species}.{MARKERS_GMT_SUFFIX} | xargs -i echo \"{{}}\"'
        cmds_merge_modules = f'cat /dev/null `{find_command}` > "{gmt_dir}/{species}.{MARKERS_GMT_SUFFIX}"'
        await run_cmd(cmds_merge_modules)


def put_dataset(
        h5_dataset: H5Dataset,
        folder: str,
        collection: pymongo.collection.Collection):
    try:
        h5_dataset.convert(folder)
        collection.insert_one(h5_dataset.dataset)
        logging.info(f"Successfully inserted dataset {h5_dataset.token}")
    except pymongo.errors.DuplicateKeyError as e:
        rm_rf(folder)
        logging.error(f"Duplicated token in dataset {h5_dataset.token}")


def update_dataset(
        old_dataset: Dict,
        h5_dataset: H5Dataset,
        folder: str,
        collection: pymongo.collection.Collection):

    try:
        rm_rf(folder)
        h5_dataset.convert(folder)
        collection.update_one({'_id': old_dataset['_id']},
                              {'$set': h5_dataset.dataset})
        logging.info(f"Successfully updated dataset {h5_dataset.token}")
    except pymongo.errors.DuplicateKeyError as e:
        rm_rf(folder)
        logging.error(f"Duplicated token in dataset {h5_dataset.token}")
    except Exception as e:
        rm_rf(folder)
        logging.error(f"Failed to update dataset {h5_dataset.token} due to: {e}")


async def remove_dataset(path_to_dataset: str,
                   out_dir: str,
                   gmt_dir: str,
                   collection: pymongo.collection.Collection):

    dataset = collection.find_one({'selfPath': path_to_dataset})
    if dataset is not None:
        convert_folder = os.path.join(out_dir, dataset["token"])
        collection.delete_one({'selfPath': path_to_dataset})
        rm_rf(convert_folder)
        await modules_merger(out_dir, gmt_dir)
        logging.info(f"Successfully removed dataset {dataset['token']}")


async def insert_dataset(path_to_dataset: str,
                   out_dir: str,
                   gmt_dir: str,
                   collection: pymongo.collection.Collection):
    convert_folder = None
    token = None
    try:
        h5_dataset = H5Dataset(path_to_dataset)
        dataset = h5_dataset.dataset
        token = dataset["token"]
        convert_folder = os.path.join(out_dir, token)

        path_find_res = collection.find_one({
            "selfPath": path_to_dataset
        })

        token_find_res = collection.find_one({
            "token": token
        })

        if path_find_res is None and token_find_res is None:
            put_dataset(h5_dataset, convert_folder, collection)
        elif path_find_res is None and token_find_res is not None:
            logging.error(f"Duplicated token in dataset {h5_dataset.token}")
        elif path_find_res is not None:
            update_dataset(path_find_res, h5_dataset, convert_folder, collection)
        await modules_merger(out_dir, gmt_dir)
    except H5DatasetInvalidException as e:
        logging.error(f"Invalid dataset {path_to_dataset}: {e}")
    except Exception as e:
        if convert_folder is not None:
            rm_rf(convert_folder)
        logging.error(f"Failed to update dataset {token} due to: {e}")