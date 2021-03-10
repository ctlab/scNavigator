package ru.itmo.scn.fs

import com.mongodb.client.MongoCollection
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import org.litote.kmongo.and
import org.litote.kmongo.eq
import org.litote.kmongo.ne
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import java.nio.file.Paths


fun generateAnnotationJSONs(
    mongoDBCollection: MongoCollection<SCDataset>,
    outDir: String
) {
    val datasets = mongoDBCollection.find(
        and(
            SCDataset::public eq true,
            SCDataset::gmtFile ne null,
            SCDataset::gmtAnnotationFile ne null
        )
    )
    val charset: Charset = StandardCharsets.UTF_8
    val gmtAnnotationFiles = datasets.mapNotNull { it.gmtAnnotationFile }
    val inputs = gmtAnnotationFiles.map { Paths.get(it) }
        .map { it.toFile().readText(charset) }
        .map { Json.parseToJsonElement(it) }

    val outAnnotationJson = Paths.get(outDir, GMT_ANNOTATION_OUT_FILE)
    val outJson = buildJsonObject {
        for (input in inputs) {
            val jsonObj = input.jsonObject;
            for (entry in jsonObj.entries) {
                put(entry.key, entry.value)
            }
        }
    }

    outAnnotationJson.toFile().writeText(
        outJson.toString(), charset
    )

}