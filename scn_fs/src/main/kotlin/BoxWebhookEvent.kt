package ru.itmo.scn.fs

import com.box.sdk.BoxFile
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.google.gson.JsonObject
import kotlin.reflect.KClass


@JsonIgnoreProperties(ignoreUnknown = true)
data class WebhookUser(val type:String, val name:String)

@JsonIgnoreProperties(ignoreUnknown = true)
data class BoxSource(
    val type: String,
    val name: String? = null,
    val id:String,
    @JsonProperty("path_collection")
    val path: BoxPath? = null,
    val parent: BoxSource? = null
)

data class BoxPath constructor (val path_lengh:Long, val path_entries:List<String>){
    @JsonCreator()
    constructor(@JsonProperty("entries") entries:List<Map<String, String>>, @JsonProperty("total_count") total_count:Long):
    this(total_count, entries.map{it["name"].toString()})
}


@JsonIgnoreProperties(ignoreUnknown = true)
data class WebhookMessage constructor(
    val trigger: String,
    val source: BoxSource,
    val additional_info:BoxInfo
)

@JsonDeserialize(using = InfoDeserializer::class)
sealed class BoxInfo{
}
data class RenameInfo @JsonCreator constructor(@JsonProperty("old_name") val old_name :String):BoxInfo()
data class  MoveInfo @JsonCreator constructor(@JsonProperty("before") val before:BoxSource, @JsonProperty("after") val after:BoxSource):BoxInfo()
data class EmptyInfo@JsonCreator constructor(val value:Any):BoxInfo()   




class InfoDeserializer : JsonDeserializer<BoxInfo>() {
    override fun deserialize(jsonParser: JsonParser, ctxt: DeserializationContext?): BoxInfo {
        val node = jsonParser.codec.readTree<JsonNode>(jsonParser)
        if (node.has("after")){
            return( MoveInfo(BoxSource(type = node.get("before").get("type").asText(), id = node.get("before").get("id").asText()),
            BoxSource(type = node.get("after").get("type").asText(), id = node.get("after").get("id").asText())))
        }
        if (node.has("old_name")){
            return(RenameInfo(node.get("old_name").asText()))
        }
        return EmptyInfo(node);
    }
 }