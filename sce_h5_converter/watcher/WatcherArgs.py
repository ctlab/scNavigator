import argparse

parser = argparse.ArgumentParser(description='Watches directory for h5ad files. Adds single-cell explorer datasets to ')
parser.add_argument('DIRECTORY', help='Directory to watch for h5ad dataset changes')
parser.add_argument('OUTDIR', help='Directory to store internal sce files')
parser.add_argument('MONGODBHOST', help='Host for MongoDB database storing datasets')
parser.add_argument('MONGODATABASE', help='Database name within MongoDB')
parser.add_argument('MONGODBCOLLECTION', help='Collection name within database within MongoDB')
parser.add_argument('-i', '--interval', type=int, help='Number of seconds between tries', default=60)

