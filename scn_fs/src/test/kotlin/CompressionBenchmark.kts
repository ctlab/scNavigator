import ru.itmo.scn.fs.H5ExpressionDataset
import kotlin.random.Random
import kotlin.system.measureTimeMillis

val absPath = "/home/askmebefore/Downloads/datasets_chunked"
//val compressionLevels = 0..9
//val datasets = listOf("SRS2532210", "SRS3670040", "SRS6213761", "SRS7441143")

val compressionLevels = 0..9
val datasets = listOf("SRS2532210", "SRS3670040", "SRS6213761")

val genes = List(100) { Random.nextInt(0, 6000) }
val geneSets = listOf<List<Int>>(
    genes.slice(0..10),
    genes.slice(10..30),
    genes.slice(30..60),
    genes.slice(60..99)
)

for (dataset in datasets) {
    for (comp in compressionLevels) {
        val folderName = "%s_%s".format(dataset, comp.toString())
        val h5path = "%s/%s/%s".format(absPath, folderName, "data.h5")
        val h5 = H5ExpressionDataset(h5path)

        val timeInMillisSingleGenes = measureTimeMillis {
            for (gene in genes) {
                h5.getFeatureByIndex(gene)
            }
        }

        val timeInMillisGeneSet10 = measureTimeMillis {
            for (i in 1..10) {
                h5.getFeaturesAverage(geneSets[0])
            }
        }

        val timeInMillisGeneSet20 = measureTimeMillis {
            for (i in 1..10) {
                h5.getFeaturesAverage(geneSets[1])
            }
        }

        val timeInMillisGeneSet30 = measureTimeMillis {
            for (i in 1..10) {
                h5.getFeaturesAverage(geneSets[2])
            }
        }

        val timeInMillisGeneSet40 = measureTimeMillis {
            for (i in 1..10) {
                h5.getFeaturesAverage(geneSets[3])
            }
        }

        println("Average gene request for %s is %f".format(folderName, timeInMillisSingleGenes / 100.0))
        println("Average time for gene set of 10 genes for %s is %f".format(folderName, timeInMillisGeneSet10 / 10.0))
        println("Average time for gene set of 20 genes for %s is %f".format(folderName, timeInMillisGeneSet20 / 10.0))
        println("Average time for gene set of 30 genes for %s is %f".format(folderName, timeInMillisGeneSet30 / 10.0))
        println("Average time for gene set of 40 genes for %s is %f".format(folderName, timeInMillisGeneSet40 / 10.0))

    }

}

