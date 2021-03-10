package ru.itmo.scn.fs
import java.io.File

fun touchEveryFile(directory: File) {
    for (file in directory.walk()) {
        if (file.name == DATASET_FILE_NAME) {
//            Log.info("Touching ${file.absolutePath}")
            file.setLastModified(System.currentTimeMillis())
        }
    }
}