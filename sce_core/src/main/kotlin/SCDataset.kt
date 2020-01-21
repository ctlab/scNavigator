package ru.itmo.sce.core

import kotlinx.serialization.Serializable
import org.litote.kmongo.Id
import org.litote.kmongo.newId

@Serializable
data class SCDataset (
    val _id: Id<SCDataset> = newId(),
    val token: String,
    val name: String?,
    val description: String?,
    val link: String?,
    val species: String,
    val expType: ExpressionType,
    val cells: Int,
    val public: Boolean,
    val curated: Boolean,
    val debug: Boolean,
    val selfPath: String,
    val datasetFile: String,
    val plotDataFile: String,
    val markersFile: String?,
    val expressionFile: String?,
    val expH5Table: String?,
    val files: List<String>
)