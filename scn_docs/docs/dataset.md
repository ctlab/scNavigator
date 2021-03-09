---
id: scn_dataset
title: scNavigator dataset
slug: /
---

Single-cell Navigator requires several files to be present for each dataset:

General (these files are required):
* `dataset.json` (required) contains description of the dataset.
* `plot_data.json` (required) contains calculated information about every cell (like clustering and tSNE coordinates) as well as precalculated annotations (like cluster borders)

Expression data:
* `exp_data.json` contains gene names and cell barcodes in the same order as they appear in expression matrix, as well as number of total UMIs in the cell.
* `data.h5` is an expression (count) matrix. HDF5 allows storing counts effectively: since for the scNavigator we mostly need to look expression of a gene in the datasets, HDF5 can effectively compress columns of integers.

Markers:
* `markers.json` json file describing gene expression markers (optional)

Gene signature search:
* `species.modules.gmt` where `species` are `hs`, `mm` or `rn` depending on your dataset
* `modules.annotation.json` describing each of the modules present in the `species.modules.gmt`

Extra files:
* `files` is a directory (next to `dataset.json`) where you can put any additional files of choice (optional)


In the next vignettes we will describe structure of every of these files.

