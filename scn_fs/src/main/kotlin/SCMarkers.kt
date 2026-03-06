package ru.itmo.scn.fs
import com.fasterxml.jackson.core.JsonFactory
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.core.JsonToken
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.File
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import de.jupf.staticlog.Log
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
    val _id: org.litote.kmongo.Id<SCMarkerEntry> = org.litote.kmongo.newId(),
    val token: String,
    val tableName: String,
    val pValue: Double,
    val pValueAdjusted: Double,
    val averageLogFoldChange: Double,
    val pct1: Double,
    val pct2: Double,
    val cluster: String,
    val gene: String
)
@Serializable
data class MarkerCollection(
    val collection: Map<String, List<MarkerEntry>>
) {
    companion object Factory {
        private val objectMapper: ObjectMapper = ObjectMapper(JsonFactory().apply {
            enable(JsonParser.Feature.ALLOW_COMMENTS)
            enable(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES)
            enable(JsonParser.Feature.ALLOW_SINGLE_QUOTES)
        })
        fun flowFromJsonFile(filePath: String): Flow<Pair<String, MarkerEntry>> = flow {
            val file = File(filePath)
            require(file.exists() && file.isFile) { "File does not exist or is not a valid file: $filePath" }
            val jsonParser = objectMapper.factory.createParser(file)
            try {
                jsonParser.use {
                    val rootNode: JsonNode = objectMapper.readTree(jsonParser)
                    Log.info("start markers ${file}")
                    rootNode.fields().forEach { (tableName, itemsNode) ->
                        if (itemsNode == null || !itemsNode.isArray) {
                            Log.info("Missing or invalid itemsNode for table: $tableName")
                            return@forEach
                        }
                        itemsNode.forEach { itemNode ->
                            try {
                                val pValueNode = itemNode.get("p_val")
                                val pValueAdjNode = itemNode.get("p_val_adj")
                                val avgLogFCNode = itemNode.get("avg_logFC")
                                val pct1Node = itemNode.get("pct.1")
                                val pct2Node = itemNode.get("pct.2")
                                val clusterNode = itemNode.get("cluster")
                                val geneNode = itemNode.get("gene")
                                if (pValueNode == null || pValueAdjNode == null || avgLogFCNode == null || pct1Node == null || pct2Node == null || clusterNode == null || geneNode == null) {
                                    Log.info("Missing necessary fields in itemNode: $itemNode")
                                    return@forEach
                                }
                                val markerEntry = MarkerEntry(
                                    pValue = pValueNode.asDouble(),
                                    pValueAdjusted = pValueAdjNode.asDouble(),
                                    averageLogFoldChange = avgLogFCNode.asDouble(),
                                    pct1 = pct1Node.asDouble(),
                                    pct2 = pct2Node.asDouble(),
                                    cluster = clusterNode.asText(),
                                    gene = geneNode.asText()
                                )
                                emit(tableName to markerEntry) // Emit each entry pair
                            } catch (e: Exception) {
                                Log.info("Error parsing MarkerEntry: ${e.message}")
                                e.printStackTrace()
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.info("Error processing JSON file $filePath: ${e.message}")
                e.printStackTrace()
            }
        }
    }
}