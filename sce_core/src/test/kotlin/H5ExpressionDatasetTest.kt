import org.junit.Test
import ru.itmo.sce.core.H5ExpressionDataset
import kotlin.test.*

class H5ExpressionDatasetTest {

    companion object {
        val datasetPath = "/home/askmebefore/Downloads/SRS3669141_with_uns.h5ad"
    }

    @Test
    fun testDatasetLoads() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath)
        val values = h5ExpressionDataset.getIndPtrSlice(0, 19)
        val expectedValues = intArrayOf(0,  277,  362,  483,  512,  715,  719,  738,  752,  858,  940,
            947,  982, 1152, 1773, 1829, 1883, 2064, 2138, 2172)
        assertTrue(values.contentEquals(expectedValues))
    }

    @Test
    fun testDatasetIndPtrRequests() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath)
        val expectedValues = intArrayOf(0,  277,  362,  483,  512,  715,  719,  738,  752,  858,  940,
            947,  982, 1152, 1773, 1829, 1883, 2064, 2138, 2172)
        for (i in 0 until 19) {
            val requestedVals = h5ExpressionDataset.getIndPtrSlice(i, i + 1)
            assertEquals(expectedValues.slice(i..i+1), requestedVals.toList())
        }
    }

    @Test
    fun testGetShape() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath)
        assertEquals(listOf("h5sparse_format", "h5sparse_shape"), h5ExpressionDataset.attrNames)
        assertEquals(listOf(7217, 13873), h5ExpressionDataset.shape.toList())
    }

    @Test
    fun testGetGene() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath)
        val geneId = 0
        val values = h5ExpressionDataset.getFeatureByIndex(geneId)
        assertEquals(277, values.filter { it > 0 }.size)

        val expectedValues = floatArrayOf(
            0F, 1F, 0F, 0F, 0F, 0F, 0F, 0F, 0F, 0F,
            0F, 0F, 1F, 0F, 0F, 1F, 0F, 0F, 0F, 0F
        )
        assertEquals(expectedValues.toList(), values.slice(0 until 20).toList())
        assertEquals(303.0F, values.sum())
    }
}