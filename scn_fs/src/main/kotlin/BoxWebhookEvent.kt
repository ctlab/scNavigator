package ru.itmo.scn.fs

import com.box.sdk.BoxFile
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.google.gson.JsonObject



@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "type")
sealed class BoxInfo{
    val type = this::class.java.simpleName
}
data class RenameInfo @JsonCreator constructor(@JsonProperty("old_name") val old_name :String):BoxInfo()
data class  MoveInfo @JsonCreator constructor(@JsonProperty("before") val before:BoxSource, @JsonProperty("after") val after:BoxSource):BoxInfo()
data class EmptyInfo@JsonCreator constructor(val value:List<Any>):BoxInfo()   





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
    val additional_info:JsonObject
)

