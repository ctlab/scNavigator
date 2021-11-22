package ru.itmo.scn.server

data class SingleGeneResponseDataset(
    val token: String,
    val name: String?,
    val description: String?,
    val link: String?,
    val count: Int,
    val percent: Double
)

data class SingleGeneResponseCluster(
    val token: String,
    val tableName: String,
    val pValue: Double,
    val pValueAdjusted: Double,
    val averageLogFoldChange: Double,
    val pct1: Double,
    val pct2: Double,
    val cluster: String,
    val gene: String,
    val name: String?,
    val description: String?,
    val link: String?
)