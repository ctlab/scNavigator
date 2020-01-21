DEFAULT_DATASET = {
    "token": "",
    "name": "",
    "description": "",
    "cells": 0,
    "species": "mm",
    "expType": "counts",
    "public": False,
    "curated": False,
    "debug": False,
    "files": []
}

REQUIRED_ADATA_KEYS = ["X", "uns", "obs", "var", "shape"]
REQUIRED_UNS_KEYS = ["token", "species", "expType"]
ALLOWED_SPECIES = {
    'hs': ['hs', 'homo sapiens'],
    'mm': ['mm', 'mus musculus'],
    'rn': ['rn', 'rattus norvegicus']
}
ALLOWED_SPECIES_FLAT = [item for ll in ALLOWED_SPECIES.values() for item in ll]
ALLOWED_EXP_TYPES = ["counts", "as_is"]


DATASET_FILE = "dataset.json"
EXP_DATA_FILE = "exp_data.json"
MARKERS_FILE = "markers.json"
PLOT_DATA_FILE = "plot_data.json"
FILE_FOLDER = "files"
EXPRESSION_FILE = "data.h5"

REDUCTION_DIMS_TO_KEEP = 10
