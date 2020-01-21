import anndata as ad
import numpy as np
import json

from pandas import CategoricalDtype
from typing import List, Tuple, Optional

from scipy.sparse import csc_matrix

from converter.NumpyEncoder import NumpyEncoder
from converter.Types import ExpData, Dataset, PlotData
from converter.Constants import *
from converter.Utils import *
from converter.Exceptions import *
from itertools import zip_longest

import logging


class H5Dataset:
    h5ad_path: str
    adata: ad.AnnData
    dims: Tuple[int, int]
    n_features: int
    n_barcodes: int
    features: List[str]
    barcodes: List[str]
    dataset: Dataset
    exp_data: ExpData
    markers: Optional[dict]
    plot_data: Optional[PlotData]

    def __init__(self, h5ad_path: str):
        self.token: str
        self.h5ad_path = h5ad_path
        self.adata = ad.read_h5ad(h5ad_path)
        self.adata.X = csc_matrix(self.adata.X)

        self.dims = self.adata.shape
        self.n_barcodes = self.dims[0]
        self.n_features = self.dims[1]

        present = list(map(lambda x: hasattr(self.adata, x), REQUIRED_ADATA_KEYS))

        if not all(present):
            missing_values = [i for i, x in enumerate(present) if not x]
            missing_values_str = ", ".join(map(lambda x: REQUIRED_ADATA_KEYS[x], missing_values))
            raise H5DatasetInvalidException("Invalid h5ad object, missing values: {}".format(missing_values_str))

        present = list(map(lambda x: x in self.adata.uns_keys(), REQUIRED_UNS_KEYS))
        if not all(present):
            missing_values = [i for i, x in enumerate(present) if not x]
            missing_values_str = ", ".join(map(lambda x: REQUIRED_UNS_KEYS[x], missing_values))
            raise H5DatasetInvalidException("Invalid uns object, missing values: {}".format(missing_values_str))

        self.features = list(self.adata.var.index.values)
        self.barcodes = list(self.adata.obs.index.values)

        if self.n_features != len(self.features):
            raise H5DatasetInvalidException("Dataset size and obs size are inconsistent: {} and {}",
                                            self.n_features, len(self.features))

        if self.n_barcodes != len(self.barcodes):
            raise H5DatasetInvalidException("Dataset size and var size are inconsistent: {} and {}",
                                            self.n_barcodes, len(self.barcodes))

        self.__uns = json.loads(json.dumps(dict(self.adata.uns), cls=NumpyEncoder))
        self.dataset = dict(DEFAULT_DATASET,
                            **{k: self.__uns[k]
                               for k in DEFAULT_DATASET.keys()
                               if k in self.__uns.keys()})

        self.dataset["selfPath"] = h5ad_path

        if self.dataset["cells"] == 0:
            self.dataset["cells"] = self.n_barcodes

        # check if token is empty
        if self.dataset["token"] == "":
            raise H5DatasetInvalidException("Empty tokens are not allowed")

        self.token = self.dataset["token"]

        if type(self.dataset["species"]) == list:
            species_set = set(self.dataset["species"])
            if len(species_set) > 1:
                raise H5DatasetInvalidException(f"Datasets of multiple species are not allowed {', '.join(species_set)}")
            self.dataset["species"] = self.dataset["species"][0]

        if self.dataset["species"].lower() not in ALLOWED_SPECIES_FLAT:
            raise H5DatasetInvalidException("Species {} are not allowed. Allowed species are "
                                            .format(self.dataset["species"], ", ".join(ALLOWED_SPECIES)))
        else:
            species = \
            [key for key in ALLOWED_SPECIES.keys() if self.dataset["species"].lower() in ALLOWED_SPECIES[key]][0]
            self.dataset["species"] = species

        if self.dataset["expType"] not in ALLOWED_EXP_TYPES:
            raise H5DatasetInvalidException("Expression type {} is not allowed. Allowed expression types are "
                                            .format(self.dataset["expType"], ", ".join(ALLOWED_EXP_TYPES)))

        self.dataset["cells"] = int(self.dataset["cells"])
        if self.dataset["cells"] <= 0:
            raise H5DatasetInvalidException("Cells must be positive int")

        if self.dataset["name"] == "":
            self.dataset["name"] = self.dataset["token"]

        self.exp_data = ExpData(
            features=self.features,
            barcodes=self.barcodes,
            expType=self.dataset["expType"],
            totalCounts=self.adata.X.sum(1).flatten().tolist()[0]
        )

        self.plot_data = None
        self.markers = None

    def __write_to_file(self, attr, file):
        with open(file, "w") as f:
            json.dump(self.__getattribute__(attr), f, cls=NumpyEncoder)

    def _get_markers_data(self):

        if self.markers is not None:
            return self.markers

        self.markers = {}
        if "markers" in self.adata.uns_keys():
            ret_val = {}
            markers = self.adata.uns["markers"]
            marker_keys = list(markers.keys())
            for table_key in marker_keys:
                table = self.adata.uns["markers"][table_key]
                keys = table.keys()
                ret_val[table_key] = [
                    dict(zip(keys, values)) for values in zip_longest(*[table[key] for key in keys])
                ]
            self.markers = ret_val

    def _get_plot_data(self):

        if self.plot_data is not None:
            return self.plot_data

        self.plot_data = {
            'data': [],
            'fields': {},
            'annotations': {}  # TODO
        }

        bad_fields = []
        for key in self.adata.obs_keys():
            key_data = self.adata.obs[key]
            if isinstance(key_data.dtype, CategoricalDtype):
                self.plot_data["fields"][key] = {
                    "type": "factor",
                    "levels": key_data.cat.categories.values
                }
            elif np.issubdtype(key_data.dtype, np.number):

                key_min = key_data.min()
                key_max = key_data.max()

                if key_min == float('-inf') or key_min == float('inf') or \
                        key_max == float('-inf') or key_max == float('inf'):
                    logging.warning(f"Fields with infinity values are not supported")
                    logging.warning(f"Field {key} will be dropped")
                    bad_fields.append(key)
                else:
                    self.plot_data["fields"][key] = {
                        "type": "numeric",
                        "range": [
                            key_data.min(),
                            key_data.max()
                        ]
                    }

        # getting reductions
        reduction_keys = filter(lambda x: x.startswith("X_"), self.adata.obsm_keys())
        new_keys = {}
        for key in reduction_keys:
            dataset = self.adata.obsm[key]
            shape = dataset.shape
            columns = shape[1]
            new_keys[key] = []
            for i in range(min(columns, REDUCTION_DIMS_TO_KEEP)):
                new_key = (key[2:] + "_" + str(i + 1)).upper()
                new_keys[key].append(new_key)
                self.plot_data["fields"][new_key] = {
                    "type": "numeric",
                    "range": [
                        dataset[:, i].min(),
                        dataset[:, i].max()
                    ]
                }

        self.plot_data["data"] = list(
            map(
                lambda x: {k: v for k, v in x.items() if k not in bad_fields},
                map(lambda x: x[1].to_dict(),
                    self.adata.obs.iterrows())
            )

        )

        for index, x in enumerate(self.plot_data["data"]):
            for key in new_keys.keys():
                dataset = self.adata.obsm[key]
                new = new_keys[key]
                new_len = len(new)
                to_add = dict(zip(new, dataset[index, 0:new_len]))
                x.update(to_add)

    def convert(self, outdir: Optional[str] = None) -> None:

        self._get_markers_data()
        self._get_plot_data()

        if outdir is None:
            outdir = os.path.join(
                os.getcwd(),
                self.dataset["token"]
            )
        mkdir_with_check(outdir)
        mkdir_with_check(os.path.join(outdir, FILE_FOLDER))

        dataset_file, exp_data_file, plot_data_file, expression_file, markers_file = \
            os.path.join(outdir, DATASET_FILE), os.path.join(outdir, EXP_DATA_FILE), \
            os.path.join(outdir, PLOT_DATA_FILE), os.path.join(outdir, EXPRESSION_FILE), \
            os.path.join(outdir, MARKERS_FILE)

        self.__write_to_file("dataset", dataset_file)
        self.__write_to_file("exp_data", exp_data_file)
        self.__write_to_file("plot_data", plot_data_file)

        if "markers" in self.adata.uns_keys():
            self.__write_to_file("markers", markers_file)

        self.adata.write(expression_file)

        self.dataset.update({
            "datasetFile": dataset_file,
            "plotDataFile": plot_data_file,
            "expressionFile": exp_data_file,
            "expH5Table": expression_file,
            "markersFile": markers_file,
            "files": []
        })
