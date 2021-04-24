package ru.itmo.scn.fs

import com.mongodb.client.MongoCollection
import org.litote.kmongo.and
import org.litote.kmongo.eq
import org.litote.kmongo.ne
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardOpenOption


fun generateGMTs(
    mongoDBCollection: MongoCollection<SCDataset>,
    outDir: String
) {
    for (species in Species.values()) {
        val speciesName = species.name;
        val datasets = mongoDBCollection.find(
            and(
                SCDataset::public eq true,
                SCDataset::species eq species,
                SCDataset::gmtFile ne null,
                SCDataset::gmtAnnotationFile ne null
            )
        )

        val gmtFiles = datasets.mapNotNull { it.gmtFile }

        val inputs = gmtFiles.map { Paths.get(it) }
        val outGmtFile = Paths.get(outDir, speciesName + GMT_PREFIX)
        val charset: Charset = StandardCharsets.UTF_8

        if (Files.exists(outGmtFile)) {
            Files.delete(outGmtFile)
        }
        // Join files (lines)
        for (path in inputs) {
            val lines = Files.readAllLines(path, charset)
            Files.write(outGmtFile, lines, charset, StandardOpenOption.CREATE, StandardOpenOption.APPEND)
        }
    }
}