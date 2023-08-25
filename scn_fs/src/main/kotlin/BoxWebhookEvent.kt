package ru.itmo.scn.fs

import com.box.sdk.BoxFile
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonInclude
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject





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

sealed class BoxInfo{
    class RenameInfo (val old_name :String):BoxInfo()
    class MoveInfo(val before:BoxSource, val after:BoxSource)
    class EmptyInfo(val value:List<Any>)
    
}


