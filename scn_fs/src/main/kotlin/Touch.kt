package ru.itmo.scn.fs
import kotlinx.coroutines.channels.Channel
import java.io.File
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardWatchEventKinds
import java.nio.file.WatchEvent

suspend fun pushDescriptorsToQueue(directory: File,
                                   outChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>) {
    for (file in directory.walk()) {
        if (file.name == DATASET_FILE_NAME) {
            val fullPath = Paths.get(file.absolutePath)
            outChannel.send(Pair(fullPath, StandardWatchEventKinds.ENTRY_MODIFY))
        }
    }
}