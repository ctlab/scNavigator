---
id: scn_expression
title: "scNavigator: expression dataset"
---

Since scNavigator was designed to be used with thousands of different datasets in web, we needed a file-format
that allowed relatively quick access to any gene of interest in any of the datasets.

We decided that we could use sparse matrix representation for counts data in hdf5 format.
The following structure of the hdf5 file was deeply influenced by how counts are stored in AnnData in scanpy,
which is natural way to keep Compressed Sparse Column matrix in hdf5 file.


## HDF5 file: `data.h5`

Here and below CSC is Compressed Sparse Column matrix. Columns are genes, and this representation will allow us to 
quickly obtain expression levels for any gene.

File `data.h5` has to have one group `X`. Within this group file should have 3 datasets:

* `indices` CSC format index array (int array)
* `indptr` CSC format index pointer array (int array)
* `data` data array of non-zero elements of the matrix (important: **float** array)

Group `X` also has attribute `shape` which is two-element int array: `[number of cells, number of genes]`



### Codes with conversion examples

To convert something like Seurat object to proper hdf5 file, you can use snippet below, or can use our converter.

```r
library(Seurat)
library(Matrix)
library(rhdf5)

## here and below seurat is Seurat object

counts <- GetAssayData(seurat, "counts")
counts <- as(counts, "RsparseMatrix")


## new h5 creation

newH5File <- file.path("data.h5")

h5createFile(newH5File)
h5createGroup(newH5File, "X")

genes <- nrow(counts)
barcodes <- ncol(counts)
nonZero <- length(counts@x)

h5createDataset(newH5File, "X/indptr", c(genes + 1),
                storage.mode = "integer", level=9)
h5write(counts@p, newH5File, "X/indptr")

h5createDataset(newH5File, "X/indices", c(nonZero),
                storage.mode = "integer", level=9)
h5write(counts@j, newH5File, "X/indices")

h5createDataset(newH5File, "X/data", c(nonZero),
                storage.mode = "double", level=9)
h5write(as.double(counts@x), newH5File, "X/data")
h5closeAll()

h5writeAttribute(c(barcodes, genes), newH5File, "shape")

id <- H5Fopen(newH5File)
group <- H5Gopen(id, "X")
h5writeAttribute(c(barcodes, genes), group, "shape")
h5closeAll()

```


## `exp_data.json`


This file simply contains gene/feature names, cell barcodes/names and total UMI per cell. 
Special field is "expType" that tells the scNavigator which format expression data is: supported values are `"counts"` 
and `"as_is"`. If the value is `"counts"` scNavigator will by default apply library size / log2 normalizations to the data,
otherwise it will be used as is.

This file must reflect row and column names of matrix `data.h5` which contains expression data.

```json
{
  "features": ["TSPAN6", "DPM1", "SCYL3", "C1orf112", "CFH", "FUCA2", ...],
  "barcodes": ["00ca0d37-b787-41a4-be59-2aff5b13b0bd","0103aed0-29c2-4b29-a02a-2b58036fe875", ... ],
  "totalCounts": [890612, 939514, ...],
  "expType": "counts"
}
```

When a user queries expression of gene `CD14` in the dataset, we first find index of this gene in `genes` array, and then ask server expression of a gene with this ID.

I.e. on a client side we would do something like

```js

let geneId = expData.genes.indexOf("Cd14");
let geneExpression = getExpressionData(geneId); // request expression of geneId from the server

```

This is super important that file `exp_data.json` was consistent with `data.h5`.

Links:

* AnnData structure from scanpy: https://scanpy.readthedocs.io/en/stable/usage-principles.html
* Compressed Sparse Column matrix implementation in scipy: tohttps://docs.scipy.org/doc/scipy/reference/generated/scipy.sparse.csc_matrix.html