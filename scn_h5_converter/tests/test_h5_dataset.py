import os
import unittest
from typing import List, Iterable

from converter.Constants import *
from converter.H5Dataset import H5Dataset
from converter.Utils import rm_rf

DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class H5DatasetTest(unittest.TestCase):
    h5_dataset: H5Dataset

    def setUp(self) -> None:
        self.h5_dataset = H5Dataset(os.path.join(DIRECTORY, "resources/SRS3434028_with_uns.h5ad"))

    def test_creation(self):
        self.assertEqual(True, isinstance(self.h5_dataset, H5Dataset))

    def test_dims(self):
        self.assertEqual((3349, 13337), self.h5_dataset.dims)
        self.assertEqual(13337, self.h5_dataset.n_features)
        self.assertEqual(3349, self.h5_dataset.n_barcodes)

    def test_features(self):
        feature_len = len(self.h5_dataset.features)
        self.assertEqual(['CICP27', 'AP006222.1', 'AL732372.2'],
                         self.h5_dataset.features[0:3])
        self.assertEqual(['MT-CYB', 'AC011043.1', 'AC007325.4', 'AC004556.1', 'AC240274.1'],
                         self.h5_dataset.features[feature_len - 5:feature_len])

    def test_uns_keys(self):
        required_keys = list(DEFAULT_DATASET.keys())
        keys = list(self.h5_dataset.dataset.keys())
        self.assertTrue(all(map(lambda x: x in keys, required_keys)))


class FSTest(unittest.TestCase):
    def setUp(self) -> None:
        self.h5_dataset = H5Dataset(os.path.join(DIRECTORY, "resources/GSE113293_with_uns.h5ad"))
        self.dataset_path = os.path.join(DIRECTORY, self.h5_dataset.dataset["token"])

    def test_convert(self):
        os.chdir(DIRECTORY)
        self.h5_dataset.convert()
        self.assertTrue(os.path.exists(DIRECTORY))
        self.assertTrue(os.path.exists(self.dataset_path))
        self.assertTrue(os.path.exists(os.path.join(self.dataset_path, DATASET_FILE)))
        self.assertTrue(os.path.exists(os.path.join(self.dataset_path, EXP_DATA_FILE)))
        self.assertTrue(os.path.exists(os.path.join(self.dataset_path, PLOT_DATA_FILE)))

    # def tearDown(self) -> None:
    #     os.chdir(DIRECTORY)
    #     rm_rf(self.dataset_path)


# class ValidDatasetsTest(unittest.TestCase):
#     valid_datasets: Iterable[str]
#     valid_paths: List[str]
#
#     def setUp(self) -> None:
#         resource_dir = os.path.join(DIRECTORY, "resources")
#         self.valid_datasets = map(lambda x: os.path.join(resource_dir, x),
#                                   filter(lambda x: x.startswith("GSE"), os.listdir(resource_dir)))
#         self.valid_paths = []
#
#     def test_valid(self):
#         os.chdir(DIRECTORY)
#         for dataset in self.valid_datasets:
#             h5_dataset = H5Dataset(dataset)
#             h5_dataset.convert()
#             dataset_path = os.path.join(DIRECTORY, h5_dataset.token)
#             self.valid_paths.append(dataset_path)
#             self.assertTrue(os.path.exists(dataset_path))
#             self.assertTrue(os.path.exists(h5_dataset.dataset["datasetFile"]))
#             self.assertTrue(os.path.exists(h5_dataset.dataset["plotDataFile"]))
#             self.assertTrue(os.path.exists(h5_dataset.dataset["expressionFile"]))
#             self.assertTrue(os.path.exists(h5_dataset.dataset["expH5Table"]))
#             self.assertTrue(os.path.exists(h5_dataset.dataset["markersFile"]))
#
#     def tearDown(self) -> None:
#         os.chdir(DIRECTORY)
#         for valid_path in self.valid_paths:
#             rm_rf(valid_path)


if __name__ == '__main__':
    unittest.main()
