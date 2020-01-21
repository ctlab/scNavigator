import org.junit.Assert
import org.junit.Test
import ru.itmo.sce.core.*
import java.lang.IllegalArgumentException
import kotlin.test.*

class MathTest {

    @Test
    fun testSD() {
        val x = floatArrayOf(1F, 2F, 3F, 4F, 5F)
        val sd = x.sd()
        Assert.assertEquals(1.581139, sd, 0.001)
    }

    @Test
    fun testZScore() {
        val x = floatArrayOf(1F, 2F, 3F, 4F, 5F)
        val z = x.scale()

        Assert.assertArrayEquals(floatArrayOf(-1.2649111F, -0.6324555F, 0.0F, 0.6324555F, 1.2649111F), z, 0.0001F)
    }

    @Test
    fun testSum() {
        val a = floatArrayOf(1F, 2F, 3F, 4F, 5F)
        val b = floatArrayOf(2F, 3F, 4F, 4F, -2F)
        val c = floatArrayOf(1F, 2F, 3F)
        val ans = floatArrayOf(3F, 5F, 7F, 8F, 3F)


        Assert.assertArrayEquals(
            ans, a.add(b), 0.00001F
        )

        assertFailsWith<IllegalArgumentException>{
            b.add(c)
        }

    }
}