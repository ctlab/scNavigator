package ru.itmo.scn.fs
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.litote.kmongo.Id
import org.litote.kmongo.newId
import java.io.File
import java.nio.file.Path
import java.nio.file.Paths

// Check if some kind inheritance can be used for data classes in kotlin.
// According to https://stackoverflow.com/a/26467380/6776377
// Breslav wasn't really happy with inheritance for data classes
// But this was 2014, so maybe it can be done now
// Implementation below is ugly, but hopefully I will be able to rewrite it

@Serializable
data class SCJson (
    val token: String,
    val name: String? = null,
    val description: String? = null,
    val link: String? = null,
    val species: Species,
    val expType: ExpressionType,
    val cells: Int = 0,
    val public: Boolean = false,
    val curated: Boolean = false,
    val debug: Boolean = false
) {
    companion object Factory {
        fun fromJsonFile(filePath: Path): SCJson {
            val stringContent = File(filePath.toString()).readText()
            return Json.decodeFromString(stringContent)
        }
    }
}



@Serializable
data class SCDataset (
    val _id: Id<SCDataset> = newId(),
    val token: String,
    val name: String?,
    val description: String?,
    val link: String?,
    val species: Species,
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
) {
    companion object Factory {
        fun fromJsonFile(filePath: Path): SCDataset {
            val stringContent = File(filePath.toString()).readText()
            val scJson = Json.decodeFromString<SCJson>(stringContent)

            val workingDir = filePath.parent.toString()
            val plotDataFile = Paths.get(workingDir, PLOT_DATA_FILE_NAME)
            val markersFile = Paths.get(workingDir, MARKERS_FILE_NAME)
            val expressionFile = Paths.get(workingDir, EXP_DATA_FILE_NAME)
            val expH5Table = Paths.get(workingDir, H5_DATASET_FILE_NAME)
            val filesDir = Paths.get(workingDir, FILES_FOLDER_NAME).toFile()
            var files: List<String> = emptyList()


            if (filesDir.exists() && filesDir.isDirectory) {
                files = filesDir.walk().filter { !it.isDirectory }.map { it.toString() }.toList()
            }

            return SCDataset(
                token = scJson.token,
                name = scJson.name,
                description = scJson.description,
                link = scJson.link,
                species = scJson.species,
                expType = scJson.expType,
                cells = scJson.cells,
                public = scJson.public,
                curated = scJson.curated,
                debug = scJson.debug,
                selfPath = filePath.toString(),
                datasetFile = filePath.toString(),
                plotDataFile = plotDataFile.toString(),
                markersFile = if (markersFile.toFile().exists()) markersFile.toString() else null,
                expressionFile = if (expressionFile.toFile().exists()) expressionFile.toString() else null,
                expH5Table = if (expH5Table.toFile().exists()) expH5Table.toString() else null,
                files = files
            )
        }
    }
}