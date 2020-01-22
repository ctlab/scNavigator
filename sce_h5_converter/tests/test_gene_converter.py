import unittest

from gmt.Converter import GeneConverters


class GeneConverterTestCase(unittest.TestCase):

    def test_converters_present(self):
        self.assertTrue('symbol' in GeneConverters.keys())
        self.assertTrue('refseq' in GeneConverters.keys())
        self.assertTrue('ensembl' in GeneConverters.keys())

    # gene sets are not "mapping" order doesn't matter much
    def test_symbol_mouse(self):
        genes = ["Ptprc", "Cd14", "Itgax", "Itgam"]
        expected = {"12475", "16409", "16411", "19264"}
        actual = set(GeneConverters['symbol'].convert("mm", genes))
        self.assertEqual(expected, actual)

    # same genes but for rat
    def test_symbol_rat(self):
        genes = ["Ptprc", "Cd14", "Itgax", "Itgam"]
        expected = {"24699", "25021", "60350", "499271"}
        actual = set(GeneConverters['symbol'].convert('rn', genes))
        self.assertEqual(expected, actual)

    def test_symbol_human(self):
        genes = ["PTPRC", "CD14", "ITGAX", "ITGAM"]
        expected = {"929", "3684", "3687", "5788"}
        actual = set(GeneConverters['symbol'].convert('hs', genes))
        self.assertEqual(expected, actual)

    def test_symbol_mouse_rat_invalid(self):
        genes = ["PTPRC", "CD14", "ITGAX", "ITGAM"]
        expected = set()
        actual = set(GeneConverters['symbol'].convert("mm", genes))
        self.assertEqual(expected, actual)
        actual = set(GeneConverters['symbol'].convert('rn', genes))
        self.assertEqual(expected, actual)


if __name__ == '__main__':
    unittest.main()
