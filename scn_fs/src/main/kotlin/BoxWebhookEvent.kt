package ru.itmo.scn.fs

import com.box.sdk.BoxFile
import com.fasterxml.jackson.annotation.JsonIgnoreProperties

    

@JsonIgnoreProperties(ignoreUnknown = true)
data class WebhookUser(val type:String, val name:String)

@JsonIgnoreProperties(ignoreUnknown = true)
data class WebhookMessage(val trigger: String, val source: BoxFile.Info, val created_by:WebhookUser)
