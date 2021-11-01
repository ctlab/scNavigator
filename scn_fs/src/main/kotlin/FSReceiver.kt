package ru.itmo.scn.fs

import de.jupf.staticlog.Log
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import java.nio.file.Path
import java.nio.file.StandardWatchEventKinds
import java.nio.file.WatchEvent
import kotlin.time.DurationUnit
import kotlin.time.ExperimentalTime

// 10 seconds
const val TIMEDELTA_THRESHOLD = 10
const val FILENAME_TO_WATCH = DATASET_FILE_NAME

suspend fun fsReceiver(inChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>,
                       deletedChannel: Channel<Path>,
                       fileChanges: HashMap<Path, Instant>,
                       mutex: Mutex) {

    Log.info("STARTED FSReciever")
    while (true) {

        val pair = inChannel.receive()
        val fullPath = pair.first
        val kind = pair.second

//        if (fullPath.fileName.toString() != FILENAME_TO_WATCH) continue

        when (kind) {
            StandardWatchEventKinds.ENTRY_DELETE -> {
                deletedChannel.send(fullPath)
                mutex.withLock {
                    fileChanges.remove(fullPath)
                }
            }
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_MODIFY -> {
                mutex.withLock {
                    fileChanges[fullPath] = Clock.System.now()
                }
            }
        }
    }
}

@ExperimentalTime
suspend fun delayedFSReceiver(modifiedChannel: Channel<Path>,
                              fileChanges: HashMap<Path, Instant>,
                              mutex: Mutex) {
    while (true) {
        delay(100)
        mutex.withLock {
            val changes = fileChanges.filter {
                (Clock.System.now() - it.value).toDouble(DurationUnit.SECONDS) > TIMEDELTA_THRESHOLD
            }
            var pathChangePairs: List<Pair<Path, Instant>> = changes.toList()
            pathChangePairs = pathChangePairs.sortedBy { it.second }
            for (path in pathChangePairs) {
                modifiedChannel.send(path.first)
                fileChanges.remove(path.first)
            }
        }
    }
}
