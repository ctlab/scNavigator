package ru.itmo.scn.fs

import com.mongodb.client.MongoCollection
import com.mongodb.client.MongoDatabase
import com.mongodb.client.model.IndexOptions
import com.mongodb.client.model.Indexes
import de.jupf.staticlog.Log
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.datetime.Instant
import org.litote.kmongo.KMongo
import org.litote.kmongo.getCollection
import org.litote.kmongo.index
import java.io.File
import java.nio.file.FileSystems
import java.nio.file.Path
import java.nio.file.WatchEvent
import kotlin.time.ExperimentalTime
import jdk.nashorn.internal.objects.Global

val mongoDBHost: String =  System.getenv("MONGODB_HOST") ?: "mongodb://mongo:27017"
val mongoDB: String = System.getenv("MONGODB_DATABASE") ?: "scn"
val mongoDBCollectionName: String = System.getenv("MONGODB_COLLECTION") ?: "datasets"
val mongoDBCollectionExpressionName: String = System.getenv("MONGODB_COLLECTION_exp") ?: "datasets_expression_data"
val mongoDBCollectionMarkersName: String = System.getenv("MONGODB_COLLECTION_markers") ?: "markers"
val gmtOutDir: String = System.getenv("GMT_PATH") ?: ""

val client = KMongo.createClient(mongoDBHost)
val database: MongoDatabase = client.getDatabase(mongoDB)

@ExperimentalTime
fun main(args: Array<String>) {
    if (args.size < 4) {
        Log.error("FS module was run without directory to watch argument, try again")
        return
    }

    val mongoDBCollection: MongoCollection<SCDataset>;
    val mongoDBCollectionExp: MongoCollection<SCDatasetExpression>;
    val mongoDBCollectionMarkers: MongoCollection<SCMarkerEntry>

    if (!database.listCollectionNames().contains(mongoDBCollectionName)) {
        Log.info("Initializing MongoDB (dataset descriptors) for the first time")
        mongoDBCollection = database.getCollection<SCDataset>(mongoDBCollectionName)
        val indexOptions = IndexOptions().unique(true);
        mongoDBCollection.createIndex(Indexes.ascending("token", "selfPath"), indexOptions);
    } else {
        mongoDBCollection = database.getCollection<SCDataset>(mongoDBCollectionName)
    }

    if (!database.listCollectionNames().contains(mongoDBCollectionExpressionName)) {
        Log.info("Initializing MongoDB (dataset expression info) for the first time")
        mongoDBCollectionExp = database.getCollection<SCDatasetExpression>(mongoDBCollectionExpressionName)
        val indexOptions = IndexOptions().unique(true);
        mongoDBCollectionExp.createIndex(Indexes.ascending("token"), indexOptions);
    } else {
        mongoDBCollectionExp = database.getCollection<SCDatasetExpression>(mongoDBCollectionExpressionName)
    }

    if (!database.listCollectionNames().contains(mongoDBCollectionMarkersName)) {
        Log.info("Initializing MongoDB (dataset markers info) for the first time")
        mongoDBCollectionMarkers = database.getCollection<SCMarkerEntry>(mongoDBCollectionMarkersName)
        val indexOptions = IndexOptions().unique(true);
        mongoDBCollectionMarkers.createIndex(index(mapOf(
            SCMarkerEntry::token to true,
            SCMarkerEntry::tableName to true,
            SCMarkerEntry::cluster to true,
            SCMarkerEntry::gene to true
        )), indexOptions);
    } else {
        mongoDBCollectionMarkers = database.getCollection<SCMarkerEntry>(mongoDBCollectionMarkersName)
    }

    val pathChangesChannel = Channel<Pair<Path, WatchEvent.Kind<Path>>>();
    val watchService = FileSystems.getDefault().newWatchService()

    val modifiedChannel = Channel<Path>();
    val deletedChannel = Channel<Path>();
    val fileChanges = HashMap<Path, Instant>();
    val mutex = Mutex()
    val directoryToWatch = args[0]
    val gmtOutDir = args[1]

    val box_dir_path = args[2] // "All Files/test_dir"
    val fisrt_key = args[3] //"aprdjeuciqnlp1yo9d4ttwpy2zgb7ibd"
    
    val second_key = if (args.size == 5) {args[4]} else {""} //"PyU8Kq4ZpboQ7GEGzGmeZxaF84JHadEg"

    GlobalScope.launch { recursiveFSWatcher(watchService, directoryToWatch, pathChangesChannel) }
    GlobalScope.launch { fsReceiver(pathChangesChannel, deletedChannel, fileChanges, mutex) }
    GlobalScope.launch { delayedFSReceiver(modifiedChannel, fileChanges, mutex) }
    GlobalScope.launch { fileChangeHandler(modifiedChannel, mongoDBCollection,
        mongoDBCollectionExp, mongoDBCollectionMarkers) }
    GlobalScope.launch { fileDeleteHandler(deletedChannel, mongoDBCollection,
        mongoDBCollectionExp, mongoDBCollectionMarkers) }
    GlobalScope.launch { pushDescriptorsToQueue(File(directoryToWatch), pathChangesChannel) }
    GlobalScope.launch{ boxUpdateReceiver( pathChangesChannel, fisrt_key, second_key)}
    Thread.sleep(30000)
    Log.info("Now generating GMTs and annotations")
    generateGMTs(mongoDBCollection, gmtOutDir)
    generateAnnotationJSONs(mongoDBCollection, gmtOutDir)

    while (true) {
        Thread.sleep(10000)
    }
}