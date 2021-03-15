---
id: scn_dataset_json
title: scNavigator dataset descriptor
---

This file (`dataset.json`) is a main file of your dataset in file system.
scNavigator will go through provided folder and will try to find all folders that contain this file
and will consider every valid `dataset.json` as a descriptor of a scNavigator dataset.

This file contains several fields:
* `token` - ID of your dataset in scNavigator. All datasets in scNavigator must have different IDs. (required)
* `name` - Name of your dataset (if the dataset is displayed on the front page) (optional, default value is `"""`)
* `description` - Description of your dataset. (optional, defaults values is `""`)
* `link` - If you can provide a link to your dataset (GEO, SRA or publication). (optional, defaults values is `""`)
* `species` - Abbreviation of the species (without genome version). Like `hs` or `mm`. (required, supported values are `"mm"`, `"hs"` and `"rn"`)
* `cells` - Number of cells in the dataset. (optional, default is 0)
* `public` - If dataset listed as public it will be shown on the main page. (optional, default is `false`)
* `curated` - If dataset listed as public and as curated it will be shown on the main page as curated. (optional, default is `false`)
* `debug` - If dataset listed to be used with features currently in test. (optional, default `false`)

Example of valid `dataset.json`:
```json
{
    "token": "HCA_hematopoiesis",
    "name": "HCA: Profiling of CD34+ cells from human bone marrow to understand hematopoiesis",
    "description": "Differentiation is among the most fundamental processes in cell biology. Single cell RNA-seq studies have demonstrated that differentiation is a continuous process and in particular cell states are observed to reside on largely continuous spaces. We have developed Palantir, a graph based algorithm to model continuities in cell state transitions and cell fate choices. Modeling differentiation as a Markov chain, Palantir determines probabilities of reaching terminal states from cells in each intermediate state. The entropy of these probabilities represent the differentiation potential of the cell in the corresponding state. Applied to single cell RNA-seq dataset of CD34+ hematopoietic cells from human bone marrows, Palantir accurately identified key events leading up to cell fate commitment. Integration with ATAC-seq data from bulk sorted populations helped identify key regulators that correlate with cell fate specification and commitment.",
    "link": "https://data.humancellatlas.org/explore/projects/091cf39b-01bc-42e5-9437-f419a66c8a45",
    "species": "hs",
    "cells": 33829,
    "public": true,
    "curated": true
}
```
