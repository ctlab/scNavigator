package ru.itmo.scn.server

data class BulkGeneSearchBody(val genes: List<Int>, val token: String)