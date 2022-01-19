package ru.itmo.scn.server

data class BulkGeneSearchBody(val bulkGeneSet: String, val token: String)
data class SingleGeneSearchBody(val gene: String)