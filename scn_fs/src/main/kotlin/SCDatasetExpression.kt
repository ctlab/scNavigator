package ru.itmo.scn.fs

import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import org.litote.kmongo.Id
import org.litote.kmongo.newId
import java.io.File
import java.nio.file.Path


@Serializable
data class SCExpressionJson (
    val features: List<String>,
    val featureCounts: Map<String, Int>?,
    val barcodes: List<String>,
    val totalCounts: List<Int>,
    val expType: ExpressionType,
) {
    companion object Factory {
        fun fromJsonFile(filePath: Path): SCExpressionJson {
            val stringContent = File(filePath.toString()).readText()
            return format.decodeFromString(stringContent)
        }
    }
}

@Serializable
data class SCDatasetExpression (
    val _id: Id<SCDatasetExpression> = newId(),
    val token: String,
    val features: List<String>,
    val featureCounts: Map<String, Int>?,
    val barcodes: List<String>,
    val totalCounts: List<Int>,
    val expType: ExpressionType,
) {
    companion object Factory {
        fun fromJsonFile(filePath: String, token: String): SCDatasetExpression {
            val stringContent = File(filePath).readText()
            val scExpressionJson = format.decodeFromString<SCExpressionJson>(stringContent)

            return SCDatasetExpression(
                token = token,
                features = scExpressionJson.features,
                featureCounts = scExpressionJson.featureCounts,
                barcodes = scExpressionJson.barcodes,
                totalCounts = scExpressionJson.totalCounts,
                expType = scExpressionJson.expType
            )
        }
    }
}