---
id: scn_plot_data
title: scNavigator data for plotting
---

Plot data contains of three parts: `fields`, `data` and `annotations` and stored in file called `plot_data.json`.

### `fields`
Fields describe which variables for each cell are present, what type they are (numeric or factor) and value range / factor levels.
Currently, we only support numeric and factor variables.

Fields only support two types: `"numeric"` and `"factor"`.

Numeric variables have to be provided with the `"range"` that these
values can take. `"range"` is a two-element list of minimum and maximum value of the described variable.

Factor variables have to be provided with all the levels (values) that this variable can take.

Example for a valid `fields` structure might look like:


```json
{
  "tSNE_1": {
    "type": "numeric",
    "range": [
      -68.8883,
      66.9387
    ]
  },
  "tSNE_2": {
    "type": "numeric",
    "range": [
      -54.9217,
      70.4228
    ]
  },
  "UMAP_1": {
    "type": "numeric",
    "range": [
      -12.9358,
      13.655
    ]
  },
  "UMAP_2": {
    "type": "numeric",
    "range": [
      -15.3023,
      16.4768
    ]
  },
  "Cluster": {
    "type": "factor",
    "levels": [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19"
    ]
  },
  "nUmi": {
    "type": "numeric",
    "range": [
      669818,
      1158590
    ]
  },
  "nGene": {
    "type": "numeric",
    "range": [
      353,
      11159
    ]
  },
  "nUmiLog2": {
    "type": "numeric",
    "range": [
      19.3534,
      20.1439
    ]
  },
  "nGeneLog2": {
    "type": "numeric",
    "range": [
      8.4635,
      13.4459
    ]
  }
}
```

### `data`

Data simply contains information about every cell in the dataset. Data may contain extra fields (that are not present in`fields`),
however, these fields won't show up in the scNavigator.
Example of valid `data` field is shown below:


```json
[
  {
    "tSNE_1": 64.3251,
    "tSNE_2": 11.3943,
    "UMAP_1": 1.3749,
    "UMAP_2": 16.074,
    "Cluster": "6",
    "nUmi": 890612,
    "nGene": 6899,
    "nUmiLog2": 19.7644,
    "nGeneLog2": 12.7522,
    "_row": "00ca0d37-b787-41a4-be59-2aff5b13b0bd"
  },
  {
    "tSNE_1": -10.7318,
    "tSNE_2": 8.2139,
    "UMAP_1": 1.8595,
    "UMAP_2": -2.9429,
    "Cluster": "10",
    "nUmi": 939514,
    "nGene": 3142,
    "nUmiLog2": 19.8416,
    "nGeneLog2": 11.6175,
    "_row": "0103aed0-29c2-4b29-a02a-2b58036fe875"
  },
  {
    "tSNE_1": -41.7568,
    "tSNE_2": -31.4512,
    "UMAP_1": -6.6463,
    "UMAP_2": 4.0747,
    "Cluster": "0",
    "nUmi": 918941,
    "nGene": 3802,
    "nUmiLog2": 19.8096,
    "nGeneLog2": 11.8925,
    "_row": "01a5dd09-db87-47ac-be78-506c690c4efc"
  },
  ...
]
```

### `annotations`

Annotations are usually shown on top of the plot.
For that you will need to tell scNavigator `type` of annotation (`"text"`, `"polygon"` or `"arrows"`),
which fields to use as coordinates (`coords`) and coordinates of annotation.
`value` field is used to take the actual value from the data

Below is an example of valid `annotations` for text annotations.

```json

{
  "tsne_Cluster_centers": {
    "type": "text",
    "value": "Cluster",
    "coords": [
      "tSNE_1",
      "tSNE_2"
    ],
    "data": [
      {
        "Cluster": "0",
        "tSNE_1": -35.5756,
        "tSNE_2": -32.0876,
        "Text": "0"
      },
      {
        "Cluster": "1",
        "tSNE_1": -0.7239,
        "tSNE_2": -17.0211,
        "Text": "1"
      },
      ...
    ]
  }
}
```

Polygon are sometimes useful to highlight borders of the clusters.
Polygon vertices are connected one by one in the order they are listed in the `data` field, and grouped by
variable shown in the `"value"` field. In case below points are connected by field `"group"`.



 ```json
 {
  "tsne_Cluster_borders": {
    "type": "polygon",
    "value": "group",
    "coords": [
      "tSNE_1",
      "tSNE_2"
    ],
    "data": [
      {
        "tSNE_1": -1.3811,
        "tSNE_2": -56.3444,
        "Cluster": "13",
        "group": "gr1_1"
      },
      {
        "tSNE_1": -2.8141,
        "tSNE_2": -55.6834,
        "Cluster": "13",
        "group": "gr1_1"
      },
      {
        "tSNE_1": -4.2503,
        "tSNE_2": -55.0224,
        "Cluster": "13",
        "group": "gr1_1"
      },
      ...
    ]
  }
}

```

Type `arrows` is somewhat special. It has `data_start` and `data_end` fields that specify arrow coordinates.
Annotation of type `arrows` were mostly designed to show RNA velocity or results of trajectory inference methods
on top of the dimensionality reduction plot.

Both lists `data_start` and `data_end` must have equal length. `data_start[i]` and `data_end[i]` describe i-th arrow.

Valid json object for `arrows` type will look something like:

```json

{
  "type": "arrows",
  "coords": [
    "UMAP_1",
    "UMAP_2"
  ],
  "data_start": [
    {
      "UMAP_1": -8.6807,
      "UMAP_2": -6.522
    },
    {
      "UMAP_1": -8.6807,
      "UMAP_2": -6.0223
    },
    ...
  ], 
  "data_end": [
    {
      "UMAP_1": -8.4769,
      "UMAP_2": -7.129
    },
    {
      "UMAP_1": -8.426,
      "UMAP_2": -6.8369
    },
    ...
  ]
}

```


### Whole file

Valid file `plot_data.json` will look something like:

```json

{
  "fields": {
      "tSNE_1": {
        "type": "numeric",
        "range": [
          -68.8883,
          66.9387
        ]
      },
      "tSNE_2": {
        "type": "numeric",
        "range": [
          -54.9217,
          70.4228
        ]
      },
      "UMAP_1": {
        "type": "numeric",
        "range": [
          -12.9358,
          13.655
        ]
      },
      "UMAP_2": {
        "type": "numeric",
        "range": [
          -15.3023,
          16.4768
        ]
      },
      "Cluster": {
        "type": "factor",
        "levels": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18",
          "19"
        ]
      },
      "nUmi": {
        "type": "numeric",
        "range": [
          669818,
          1158590
        ]
      },
      "nGene": {
        "type": "numeric",
        "range": [
          353,
          11159
        ]
      },
      "nUmiLog2": {
        "type": "numeric",
        "range": [
          19.3534,
          20.1439
        ]
      },
      "nGeneLog2": {
        "type": "numeric",
        "range": [
          8.4635,
          13.4459
        ]
      }
    },
  "data": [
    {
      "tSNE_1": 64.3251,
      "tSNE_2": 11.3943,
      "UMAP_1": 1.3749,
      "UMAP_2": 16.074,
      "Cluster": "6",
      "nUmi": 890612,
      "nGene": 6899,
      "nUmiLog2": 19.7644,
      "nGeneLog2": 12.7522,
      "_row": "00ca0d37-b787-41a4-be59-2aff5b13b0bd"
    },
    {
      "tSNE_1": -10.7318,
      "tSNE_2": 8.2139,
      "UMAP_1": 1.8595,
      "UMAP_2": -2.9429,
      "Cluster": "10",
      "nUmi": 939514,
      "nGene": 3142,
      "nUmiLog2": 19.8416,
      "nGeneLog2": 11.6175,
      "_row": "0103aed0-29c2-4b29-a02a-2b58036fe875"
    },
    {
      "tSNE_1": -41.7568,
      "tSNE_2": -31.4512,
      "UMAP_1": -6.6463,
      "UMAP_2": 4.0747,
      "Cluster": "0",
      "nUmi": 918941,
      "nGene": 3802,
      "nUmiLog2": 19.8096,
      "nGeneLog2": 11.8925,
      "_row": "01a5dd09-db87-47ac-be78-506c690c4efc"
    },
    ...
  ],
  "annotations": {
   "tsne_Cluster_centers": {
     "type": "text",
     "value": "Cluster",
     "coords": [
       "tSNE_1",
       "tSNE_2"
     ],
     "data": [
       {
         "Cluster": "0",
         "tSNE_1": -35.5756,
         "tSNE_2": -32.0876,
         "Text": "0"
       },
       {
         "Cluster": "1",
         "tSNE_1": -0.7239,
         "tSNE_2": -17.0211,
         "Text": "1"
       },
       ...
     ]
   },
   "tsne_Cluster_borders": {
     "type": "polygon",
     "value": "group",
     "coords": [
       "tSNE_1",
       "tSNE_2"
     ],
     "data": [
       {
         "tSNE_1": -1.3811,
         "tSNE_2": -56.3444,
         "Cluster": "13",
         "group": "gr1_1"
       },
       {
         "tSNE_1": -2.8141,
         "tSNE_2": -55.6834,
         "Cluster": "13",
         "group": "gr1_1"
       },
       {
         "tSNE_1": -4.2503,
         "tSNE_2": -55.0224,
         "Cluster": "13",
         "group": "gr1_1"
       },
       ...
     ]
   }
 }
}


```