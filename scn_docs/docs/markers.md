---
id: scn_markers
title: "scNavigator: markers file"
---

This section describes how cluster markers are stored in scNavigator.

First of all, markers in scNavigator are used for two purposes:
1. To be shown in the "markers" section on the dataset page
2. We use marker for gene signature search in scNavigator.

## `markers.json`

This is a list of data.frames of Seurat `FindAllMatrix` converted to JSON. Sometimes we would like to show more than one markers table. For example, when we performed clustering with different resolutions and then identified markers for different clustering resolutions we would like to have both of the tables in the same place.

Below is an example of valid `markers.json` file: 

```json
{
  "Cluster_0.6": [
    {
      "p_val": 0,
      "avg_logFC": 1.4697,
      "pct.1": 0.961,
      "pct.2": 0.071,
      "p_val_adj": 0,
      "cluster": 0,
      "gene": "CEL"
    },
    {
      "p_val": 7.5714e-304,
      "avg_logFC": 2.1996,
      "pct.1": 0.968,
      "pct.2": 0.082,
      "p_val_adj": 2.4281e-299,
      "cluster": 0,
      "gene": "PRSS3P1"
    },
    {
      "p_val": 1.6988e-303,
      "avg_logFC": 3.3761,
      "pct.1": 0.744,
      "pct.2": 0.026,
      "p_val_adj": 5.4479e-299,
      "cluster": 0,
      "gene": "AQP8"
    },
    {
      "p_val": 1.4416e-291,
      "avg_logFC": 2.8036,
      "pct.1": 0.872,
      "pct.2": 0.059,
      "p_val_adj": 4.6231e-287,
      "cluster": 0,
      "gene": "AZGP1"
    },
    {
      "p_val": 4.769e-291,
      "avg_logFC": 2.8413,
      "pct.1": 0.94,
      "pct.2": 0.082,
      "p_val_adj": 1.5294e-286,
      "cluster": 0,
      "gene": "ANPEP"
    },
    ...
  ],
  "Cluster_0.8": [
    {
      "p_val": 2.255e-278,
      "avg_logFC": 2.6058,
      "pct.1": 0.918,
      "pct.2": 0.081,
      "p_val_adj": 7.2317e-274,
      "cluster": 0,
      "gene": "RARRES2"
    },
    {
      "p_val": 3.0854e-274,
      "avg_logFC": 2.6125,
      "pct.1": 1,
      "pct.2": 0.117,
      "p_val_adj": 9.8946e-270,
      "cluster": 0,
      "gene": "CPA2"
    },
    {
      "p_val": 5.5019e-272,
      "avg_logFC": 4.3333,
      "pct.1": 0.918,
      "pct.2": 0.103,
      "p_val_adj": 1.7644e-267,
      "cluster": 0,
      "gene": "AMY2A"
    },
    {
      "p_val": 3.521e-265,
      "avg_logFC": 2.4203,
      "pct.1": 0.566,
      "pct.2": 0.008,
      "p_val_adj": 1.1291e-260,
      "cluster": 0,
      "gene": "AMY1C"
    },
    {
      "p_val": 6.0698e-264,
      "avg_logFC": 2.4958,
      "pct.1": 0.683,
      "pct.2": 0.027,
      "p_val_adj": 1.9465e-259,
      "cluster": 0,
      "gene": "AQP12A"
    },
    {
      "p_val": 2.9289e-262,
      "avg_logFC": 2.466,
      "pct.1": 0.979,
      "pct.2": 0.116,
      "p_val_adj": 9.3926e-258,
      "cluster": 0,
      "gene": "PNLIPRP1"
    },
    {
      "p_val": 2.0913e-259,
      "avg_logFC": 3.6326,
      "pct.1": 0.932,
      "pct.2": 0.122,
      "p_val_adj": 6.7064e-255,
      "cluster": 0,
      "gene": "CTRL"
    },
    {
      "p_val": 1.8827e-258,
      "avg_logFC": 3.0714,
      "pct.1": 0.68,
      "pct.2": 0.032,
      "p_val_adj": 6.0375e-254,
      "cluster": 0,
      "gene": "AMYP1"
    },
    {
      "p_val": 2.3942e-257,
      "avg_logFC": 0.4263,
      "pct.1": 0.947,
      "pct.2": 0.09,
      "p_val_adj": 7.6779e-253,
      "cluster": 0,
      "gene": "CUZD1"
    },
    {
      "p_val": 5.9308e-255,
      "avg_logFC": 2.3322,
      "pct.1": 0.719,
      "pct.2": 0.036,
      "p_val_adj": 1.902e-250,
      "cluster": 0,
      "gene": "AQP12B"
    },
    {
      "p_val": 3.0264e-253,
      "avg_logFC": 3.5532,
      "pct.1": 0.986,
      "pct.2": 0.153,
      "p_val_adj": 9.7053e-249,
      "cluster": 0,
      "gene": "REG1B"
    },
    ...
  ]
}
```

