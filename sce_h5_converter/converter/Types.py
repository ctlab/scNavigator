from typing import List, Optional, TypedDict, Dict


class ExpData(TypedDict):
    features: List[str]
    barcodes: List[str]
    expType: str
    totalCounts: Optional[List[int]]


class Dataset(TypedDict):
    token: str
    cells: int
    species: str
    expType: str
    public: bool
    curated: bool
    description: Optional[str]
    name: Optional[str]
    link: Optional[str]
    debug: bool
    selfPath: str
    datasetFile: str
    plotDataFile: str
    expressionFile: Optional[str]
    expH5Table: Optional[str]
    markersFile: Optional[str]
    files: List[str]


class PlotData(TypedDict):
    data: List[Dict]
    fields: Dict
    annotations: Dict
