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
import java.io.File
import java.nio.file.FileSystems
import java.nio.file.Path
import java.nio.file.WatchEvent
import kotlin.time.ExperimentalTime

val mongoDBHost: String =  System.getenv("MONGODB_HOST") ?: "mongodb://mongo:27017"
val mongoDB: String = System.getenv("MONGODB_DATABASE") ?: "scn"
val mongoDBCollectionName: String = System.getenv("MONGODB_COLLECTION") ?: "datasets"
val mongoDBCollectionExpressionName: String = System.getenv("MONGODB_COLLECTION_exp") ?: "datasets_expression_data"
val gmtOutDir: String = System.getenv("GMT_PATH") ?: ""

val client = KMongo.createClient(mongoDBHost)
val database: MongoDatabase = client.getDatabase(mongoDB)

@ExperimentalTime
fun main(args: Array<String>) {
    if (args.size != 2) {
        Log.error("FS module was run without directory to watch argument, try again")
        return
    }

    val mongoDBCollection: MongoCollection<SCDataset>;
    val mongoDBCollectionExp: MongoCollection<SCDatasetExpression>;

    if (!database.listCollectionNames().contains(mongoDBCollectionName)) {
        Log.info("Initializing MongoDB (dataset descriptors) for the first time")
        mongoDBCollection = database.getCollection<SCDataset>(mongoDBCollectionName)
        val indexOptions = IndexOptions().unique(true);
        mongoDBCollection.createIndex(Indexes.ascending("token", "selfPath"), indexOptions);
    } else {
        mongoDBCollection = database.getCollection<SCDataset>(mongoDBCollectionName)
    }

    if (!database.listCollectionNames().contains(mongoDBCollectionExpressionName)) {
        Log.info("Initializing MongoDB (dataset expresson info) for the first time")
        mongoDBCollectionExp = database.getCollection<SCDatasetExpression>(mongoDBCollectionExpressionName)
        val indexOptions = IndexOptions().unique(true);
        mongoDBCollectionExp.createIndex(Indexes.ascending("token"), indexOptions);
    } else {
        mongoDBCollectionExp = database.getCollection<SCDatasetExpression>(mongoDBCollectionExpressionName)
    }

    val pathChangesChannel = Channel<Pair<Path, WatchEvent.Kind<Path>>>();
    val watchService = FileSystems.getDefault().newWatchService()

    val modifiedChannel = Channel<Path>();
    val deletedChannel = Channel<Path>();
    val fileChanges = HashMap<Path, Instant>();
    val mutex = Mutex()
    val directoryToWatch = args[0]
    val gmtOutDir = args[1]


    GlobalScope.launch { recursiveFSWatcher(watchService, directoryToWatch, pathChangesChannel) }
    GlobalScope.launch { fsReceiver(pathChangesChannel, deletedChannel, fileChanges, mutex) }
    GlobalScope.launch { delayedFSReceiver(modifiedChannel, fileChanges, mutex) }
    GlobalScope.launch { fileChangeHandler(modifiedChannel, mongoDBCollection, mongoDBCollectionExp) }
    GlobalScope.launch { fileDeleteHandler(deletedChannel, mongoDBCollection, mongoDBCollectionExp) }

    Thread.sleep(10000)
    Log.info("Now touching all the dataset.json files in the directory")
    touchEveryFile(File(directoryToWatch))

    Thread.sleep(30000)
    Log.info("Now generating GMTs and annotations")
    generateGMTs(mongoDBCollection, gmtOutDir)
    generateAnnotationJSONs(mongoDBCollection, gmtOutDir)

    while (true) {
        Thread.sleep(10000)
    }
}