package ru.itmo.scn.server

data class SingleGeneResponse(
    val token: String,
    val name: String?,
    val description: String?,
    val link: String?,
    val count: Int,
    val percent: Double
)
