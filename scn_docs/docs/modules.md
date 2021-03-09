---
id: scn_gene_signature_search
title: "scNavigator: gene signature search"
---

This section describes how to include your dataset into the database of gene signature search.
Database consists of many gene sets (we call them modules) of markers for specific populations in scRNA-seq datasets.
So any dataset of scRNA-seq we can generate several dozens of modules: gene sets that describe specific single-cell
population in the datasets.

Given a query gene set Gene Signature Search utilizes hypergeometric test to test overlap of genes in the query with
every single module present in the database and reports p-values after adjustment for multiple hypotheses.

## Gene signature search files

To include some gene sets from your dataset in gene signature search you must prepare two files:

1. `species.modules.gmt` where `species` are `hs`, `mm` or `rn`, the species your dataset is coming from.
2. `modules.annotation.json` which will contain some of the information to be shown in the results table

Let's first explain some terminology. You processed the dataset of scRNA-seq data, and you performed 
differential expression and found markers for each of your populations.

** Universe ** - is the set of genes expressed in your dataset. There many lowly expressed genes 
that are not going to be detected in your dataset, which we would not want to affect test results.
It's only appropriate for our test to only calculate overlap in the universe of expressed genes.

** Module ** - is a gene set associated with one (or several) population in your scRNA-seq dataset.
Module can be genes from results of differential expression between clusters, can be genes that are associated
with pseudotime and so on. It's up to you to decide what information you associate with the module.

## `species.module.gmt`

GMT file has to have a following 3-column structure:
1. Identifier of the module
2. Identifier of the universe
3. Comma separated ENTREZ ids of the genes in the module

For the universe first two columns must have equal identifiers. Universes will not be used to test against using 
hypergeometric test.

Below is the example of the valid `mm.modules.gmt` (we truncated the first line, since universes tend to be quite large):

```text
SRS1913123_UNIVERSE	SRS1913123_UNIVERSE	11287,11302,11303,11304,11305,11306,11307,11308,11350,11352,11363,11364,11370,11409,11416,11418,11419,11421,11423,11425,11426,11428,11429,11430,11431,11432,11433,11435,11438,11441,11443...
SRS1913123#markers0.6#0	SRS1913123_UNIVERSE	11676,11747,11758,11816,12192,12876,12971,13010,13167,13653,14281,14319,14609,14758,14862,15205,15904,16007,16432,16476,17748,17750,18111,18212,19231,19242,20200,20674,20682,22352,64294,67945,103712,170790,192216,237759
SRS1913123#markers0.6#1	SRS1913123_UNIVERSE	11426,13518,22589,64009,226562,258762,319317,100463512
SRS1913123#markers0.6#2	SRS1913123_UNIVERSE	11820,11931,12069,12313,12314,12903,14387,14432,14704,15516,16210,16765,17984,18197,19711,20254,20257,20262,20614,20646,20979,21334,22129,22223,22629,30052,52696,52837,52906,53328,58243,65113,66995,68566,69694,72693,74511,104001,108013,227325,243339,319317,434128
SRS1913123#markers0.6#4	SRS1913123_UNIVERSE	11931,14432,18976,19711,20254,20257,22129,27220,52906,58243,104001
SRS1913123#markers0.6#5	SRS1913123_UNIVERSE	11604,12705,19711,69694,74511,109648
SRS1913123#markers0.6#6	SRS1913123_UNIVERSE	11461,11465,12140,12443,12527,12709,12799,12805,13167,14360,14758,17118,17196,18595,18606,18823,19283,19317,20193,20196,20203,20284,20720,21960,22142,22608,23829,29873,50913,50914,52589,54377,56434,64383,67092,67801,67860,73710,76960,76982,171469,233271,235072,269629,270106,320981,574402
SRS1913123#markers0.6#7	SRS1913123_UNIVERSE	11606,11676,11816,11829,11932,12032,12140,12520,12709,12759,12876,13010,13167,13602,13618,14609,14645,15902,16426,16513,17748,18217,19156,19283,20250,20255,20511,20512,20692,20720,27226,29811,54403,57776,67916,74205,75104,98660,108686,170790,171469,216739,233271,243616
...
```

## `modules.annotation.json`

Second file contains annotation for the modules that is presented in results of gene signature search. In this JSON
object you will have fields with names corresponding to modules from GMT-file. Required fields are:

* `token` this on is required, so we can automatically open the dataset from which the similar signature came from
* `name` that is shown in the results. In our case name is the same as the dataset, however, you could put cluster ID into the name
* `title` is shown next after the name. Title might have more descriptive information about the dataset and the module.
* `species` species of the module
* `link` field is for external links (if exist) to outside databases or papers.

```json
{
  "SRS1913123_UNIVERSE": {
    "token": "SRS1913123",
    "name": "GSE93374/SRS1913123",
    "title": " A Molecular Census of Arcuate Hypothalamus and Median Eminence Cell Types",
    "species": "mm",
    "link": "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE93374"
  },
  "SRS1913123#markers0.6#0": {
    "token": "SRS1913123",
    "name": "GSE93374/SRS1913123",
    "title": " A Molecular Census of Arcuate Hypothalamus and Median Eminence Cell Types",
    "species": "mm",
    "link": "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE93374"
  },
  "SRS1913123#markers0.6#1": {
    "token": "SRS1913123",
    "name": "GSE93374/SRS1913123",
    "title": " A Molecular Census of Arcuate Hypothalamus and Median Eminence Cell Types",
    "species": "mm",
    "link": "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE93374"
  },
  "SRS1913123#markers0.6#2": {
    "token": "SRS1913123",
    "name": "GSE93374/SRS1913123",
    "title": " A Molecular Census of Arcuate Hypothalamus and Median Eminence Cell Types",
    "species": "mm",
    "link": "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE93374"
  },
  ...
} 
```

### Helpful links

* Hypergeometric distribution https://en.wikipedia.org/wiki/Hypergeometric_distribution