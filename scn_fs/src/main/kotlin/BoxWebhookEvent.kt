package ru.itmo.scn.fs

import com.box.sdk.BoxFile




data class WebhookUser(val type:String, val name:String)

data class WebhookMessage(val trigger: String, val source: BoxFile.Info, val created_by:WebhookUser)
