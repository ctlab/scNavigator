package ru.itmo.scn.fs


import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json // Ensure Json is imported
import org.litote.kmongo.Id
import org.litote.kmongo.newId
import java.io.File
import java.nio.file.Path


@Serializable

data class SCExpressionJson(
    val features: List<String>,
    val featureCounts: Map<String, Float>?,
    val barcodes: List<String>,
    val totalCounts: List<Float>,
    val expType: ExpressionType,
) {

    companion object Factory {
        fun fromJsonFile(filePath: Path): SCExpressionJson {
            return File(filePath.toString()).bufferedReader().use { reader ->
                val stringContent = reader.readText()
                Json.decodeFromString(stringContent)
            }
        }
    }
}

@Serializable

data class SCDatasetExpression(
    val _id: Id<SCDatasetExpression> = newId(),
    val token: String,
    val features: List<String>,
    val featureCounts: Map<String, Float>?,
    val barcodes: List<String>,
    val totalCounts: List<Float>,
    val expType: ExpressionType,
) {

    companion object Factory {

        fun fromJsonFile(filePath: String, token: String): SCDatasetExpression {

            return File(filePath).bufferedReader().use { reader ->
                val stringContent = reader.readText()
                val scExpressionJson = Json{ ignoreUnknownKeys = true }.decodeFromString<SCExpressionJson>(stringContent)
                SCDatasetExpression(
                    token = token,
                    features = scExpressionJson.features,
                    featureCounts = scExpressionJson.featureCounts?.mapValues { it.value.toFloat() },
                    barcodes = scExpressionJson.barcodes,
                    totalCounts = scExpressionJson.totalCounts.map { it.toFloat() },
                    expType = scExpressionJson.expType
                )
            }
        }
    }
}