import org.junit.Test
import ru.itmo.scn.core.H5ExpressionDataset
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class H5ExpressionDatasetTest {

    companion object {
        val datasetPath =
            Thread.currentThread().contextClassLoader.getResource("SRS3669141_with_uns.h5ad").path.toString()
        val datasetPath2 =
            Thread.currentThread().contextClassLoader.getResource("data_test.h5").path.toString()
    }

    @Test
    fun testSecondDatasetShape() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath2)
        assertEquals(listOf(2592, 11026), h5ExpressionDataset.shape.toList())
    }

    @Test
    fun testSecondDatasetIndPtr() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath2)
        val expectedValues = intArrayOf(0, 45, 56, 78, 94, 97, 101, 120, 158, 165)
        val values = h5ExpressionDataset.getIndPtrSlice(0, 9)
        assertEquals(expectedValues.toList(), values.toList())
    }

    @Test
    fun testSecondDatasetGetDataSlice() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath2)
        val expectedValues = floatArrayOf(1F, 2F, 1F, 1F, 1F, 1F, 1F, 1F, 1F, 1F)
        val values = h5ExpressionDataset.getDataSlice(9, 18)
        assertEquals(expectedValues.toList(), values.toList())
    }

    @Test
    fun testSecondDatasetGetGene() {
        val h5ExpressionDataset = H5ExpressionDataset.getDataset(datasetPath2)
        val geneId = 4307 // Lyz2
        val expectedValues = floatArrayOf(12F, 9F, 3F, 9F, 0F, 0F, 0F, 0F, 5F,
            7F, 0F, 2F, 2F, 2F, 4F, 0F, 0F, 0F, 5F, 0F)
        val values = h5ExpressionDataset.getFeatureByIndex(geneId)

        assertEquals(values.size, h5ExpressionDataset.shape[0])
        assertEquals(expectedValues.toList(), values.slice(0 until 20).toList())
        assertEquals(8832F, values.sum())


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