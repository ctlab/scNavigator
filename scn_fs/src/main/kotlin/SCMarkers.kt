package ru.itmo.scn.fs

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import org.litote.kmongo.Id
import org.litote.kmongo.newId
import java.io.File

@Serializable
data class MarkerCollection(
    val collection: Map<String, List<MarkerEntry>>
) {
    companion object Factory {
        fun fromJsonFile(filePath: String): MarkerCollection {
            val stringContent = File(filePath).readText()
            val collection = format.decodeFromString<Map<String, List<MarkerEntry>>>(stringContent)
            return MarkerCollection(collection)
        }
    }
}

@Serializable
data class MarkerEntry(
    @SerialName("p_val")
    val pValue: Double,

    @SerialName("p_val_adj")
    val pValueAdjusted: Double,

    @SerialName("avg_logFC")
    val averageLogFoldChange: Double,

    @SerialName("pct.1")
    val pct1: Double,

    @SerialName("pct.2")
    val pct2: Double,

    @SerialName("cluster")
    val cluster: String,

    @SerialName("gene")
    val gene: String
)

@Serializable
data class SCMarkerEntry(
    val _id: Id<SCMarkerEntry> = newId(),
    val token: String,
    val tableName: String,

    @SerialName("p_val")
    val pValue: Double,

    @SerialName("p_val_adj")
    val pValueAdjusted: Double,

    @SerialName("avg_logFC")
    val averageLogFoldChange: Double,

    @SerialName("pct.1")
    val pct1: Double,

    @SerialName("pct.2")
    val pct2: Double,

    @SerialName("cluster")
    val cluster: String,

    @SerialName("gene")
    val gene: String
)


