import pathlib
from typing import List

import pandas as pd


class GeneConverter:
    df: pd.DataFrame

    def __init__(self, file: str):
        self.df = pd.read_table(file, header=None)
        self.df[1] = self.df[1].apply(str)
        self.df[2] = self.df[2].apply(str)

    def convert(self, species, genes: List[str]) -> List[str]:
        rows = self.df[(self.df[2].isin(genes)) & (self.df[0] == species)]
        return rows[1].tolist()


GeneConverters = {
    "ensembl": GeneConverter(pathlib.Path.joinpath(pathlib.Path(__file__).parent.absolute(), "ensembl-to-entrez.tsv")),
    "refseq": GeneConverter(pathlib.Path.joinpath(pathlib.Path(__file__).parent.absolute(), "refseq-to-entrez.tsv")),
    "symbol": GeneConverter(pathlib.Path.joinpath(pathlib.Path(__file__).parent.absolute(), "symbol-to-entrez.tsv"))
}
