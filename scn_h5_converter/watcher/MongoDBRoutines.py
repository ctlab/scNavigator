import logging
import pymongo
import pymongo.errors
import os

from typing import Dict
from converter.H5Dataset import H5Dataset
from converter.Exceptions import H5DatasetInvalidException
from converter.Utils import rm_rf


def put_dataset(
        h5_dataset: H5Dataset,
        folder: str,
        collection: pymongo.collection.Collection):
    try:
        h5_dataset.convert(folder)
        collection.insert_one(h5_dataset.dataset)
        logging.info(f"Successfully inserted dataset {h5_dataset.token}")
    except pymongo.errors.DuplicateKeyError as e:
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
        logging.error(f"Duplicated token in dataset {h5_dataset.token}")


def remove_dataset(path_to_dataset: str,
                   out_dir: str,
                   collection: pymongo.collection.Collection):

    dataset = collection.find_one({'selfPath': path_to_dataset})
    if dataset is not None:
        convert_folder = os.path.join(out_dir, dataset["token"])
        collection.delete_one({'selfPath': path_to_dataset})
        rm_rf(convert_folder)
        logging.info(f"Successfully removed dataset {dataset['token']}")


def insert_dataset(path_to_dataset: str,
                   out_dir: str,
                   collection: pymongo.collection.Collection):
    try:
        h5_dataset = H5Dataset(path_to_dataset)
        dataset = h5_dataset.dataset
        convert_folder = os.path.join(out_dir, dataset["token"])

        path_find_res = collection.find_one({
            "selfPath": path_to_dataset
        })

        token_find_res = collection.find_one({
            "token": dataset["token"]
        })

        if path_find_res is None and token_find_res is None:
            put_dataset(h5_dataset, convert_folder, collection)
        elif path_find_res is None and token_find_res is not None:
            logging.error(f"Duplicated token in dataset {h5_dataset.token}")
        elif path_find_res is not None:
            update_dataset(path_find_res, h5_dataset, convert_folder, collection)
    except H5DatasetInvalidException as e:
        logging.error(f"Invalid dataset {path_to_dataset}: {e}")