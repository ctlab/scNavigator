package ru.itmo.scn.fs

import com.box.sdk.BoxFile
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonCreator





@JsonIgnoreProperties(ignoreUnknown = true)
data class WebhookUser(val type:String, val name:String)

@JsonIgnoreProperties(ignoreUnknown = true)
data class BoxSource(
    val type: String,
    val name: String,
    @JsonProperty("path_collection")
    val path: BoxPath,
)

data class BoxPath @JsonCreator() constructor (val path_lengh:Long, val path_entries:List<String>){
    constructor(@JsonProperty("entries") entries:List<Map<String, String>>, @JsonProperty("total_count") total_count:Long):
    this(total_count, entries.map{it["name"].toString()})
}


@JsonIgnoreProperties(ignoreUnknown = true)
data class WebhookMessage(
    val trigger: String,
    val source: BoxSource,
    val created_by:WebhookUser
)
