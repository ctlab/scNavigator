package ru.itmo.scn.fs

import de.jupf.staticlog.Log
import kotlinx.coroutines.channels.Channel
import java.io.File
import java.nio.file.*

suspend fun recursiveFSWatcher(
    watchService: WatchService,
    directoryToWatch: String,
    outChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>) {
    val directoryFileObject = File(directoryToWatch)
    val pathToWatch = directoryFileObject.toPath()

    val pathKeys = hashMapOf<String, WatchKey>()

    for (file in directoryFileObject.walk()) {
        if (file.isDirectory) {
            Log.info(file.absolutePath)
            pathKeys[file.absolutePath] = file.toPath().register(watchService,
                StandardWatchEventKinds.ENTRY_CREATE,
                StandardWatchEventKinds.ENTRY_MODIFY,
                StandardWatchEventKinds.ENTRY_DELETE
            )
        }
    }

    val pathKey = pathToWatch.register(watchService, StandardWatchEventKinds.ENTRY_CREATE,
        StandardWatchEventKinds.ENTRY_MODIFY, StandardWatchEventKinds.ENTRY_DELETE)

    while (true) {
        val watchKey = watchService.take()

        for (event in watchKey.pollEvents()) {

            val fullPath = Paths.get(watchKey.watchable().toString(),
                event.context().toString())
            val fullFile = File(fullPath.toString())

            if (fullFile.isDirectory) {
                when (event.kind()) {
                    StandardWatchEventKinds.ENTRY_CREATE -> {
                        pathKeys[fullFile.absolutePath] = fullPath.register(watchService,
                            StandardWatchEventKinds.ENTRY_CREATE,
                            StandardWatchEventKinds.ENTRY_MODIFY,
                            StandardWatchEventKinds.ENTRY_DELETE
                        )
                        Log.info("Now also watching directory ${fullFile.absolutePath}")
                    }
                    StandardWatchEventKinds.ENTRY_DELETE -> {
                        pathKeys[fullFile.absolutePath]?.cancel()
                        pathKeys.remove(fullFile.absolutePath)
                        "Directory ${fullFile.absolutePath} is deleted, no longer watching it"
                    }
                }
            } else {
                // Log.info("SENDING EVENT TO FSReciever")
                outChannel.send(Pair(fullPath, event.kind() as WatchEvent.Kind<Path>));
            }
        }

        if (!watchKey.reset()) {
            watchKey.cancel()
//            break
        }
    }
//    pathKey.cancel()
}