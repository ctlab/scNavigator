package ru.itmo.scn.fs

import com.mongodb.client.MongoCollection
import com.mongodb.client.MongoDatabase
import com.mongodb.client.model.IndexOptions
import com.mongodb.client.model.Indexes
import com.mongodb.client.model.RenameCollectionOptions
import com.mongodb.MongoNamespace
import de.jupf.staticlog.Log
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.datetime.Instant
import org.litote.kmongo.KMongo
import org.litote.kmongo.getCollection
import org.litote.kmongo.index
import java.io.File
import java.nio.file.FileSystems
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.WatchEvent
import java.nio.file.Files
import kotlin.time.ExperimentalTime
import kotlin.collections.arrayListOf
import kotlin.streams.toList
import kotlin.streams.asSequence
import kotlinx.coroutines.delay

val mongoDBHost: String =  System.getenv("MONGODB_HOST") ?: "mongodb://mongo:27017"
val mongoDB: String = System.getenv("MONGODB_DATABASE") ?: "scn"
val mongoDBCollectionName: String = System.getenv("MONGODB_COLLECTION") ?: "datasets"
val mongoDBCollectionExpressionName: String = System.getenv("MONGODB_COLLECTION_exp") ?: "datasets_expression_data"
val mongoDBCollectionMarkersName: String = System.getenv("MONGODB_COLLECTION_markers") ?: "markers"
val gmtOutDir: String = System.getenv("GMT_PATH") ?: ""

val client = KMongo.createClient(mongoDBHost)
val database: MongoDatabase = client.getDatabase(mongoDB)





suspend fun CollectionCreator(
    directoryToWatch: String,
    gmtOutDir: String,
    tmpPath: String
){
    val tempMongoDBCollectionName = mongoDBCollectionName + "_temp"
    val tempMongoDBCollectionExpressionName = mongoDBCollectionExpressionName + "_temp"
    val tempMongoDBCollectionMarkersName = mongoDBCollectionMarkersName + "_temp"

    val mongoDBCollection: MongoCollection<SCDataset>;
    val mongoDBCollectionExp: MongoCollection<SCDatasetExpression>;
    val mongoDBCollectionMarkers: MongoCollection<SCMarkerEntry>

    mongoDBCollection = database.getCollection<SCDataset>(tempMongoDBCollectionName)


    mongoDBCollectionExp = database.getCollection<SCDatasetExpression>(tempMongoDBCollectionExpressionName)
    
    mongoDBCollectionMarkers = database.getCollection<SCMarkerEntry>(tempMongoDBCollectionMarkersName)

    
    Log.info("Starting at " + directoryToWatch)



    var k = 0
    Files.walk(Paths.get(directoryToWatch)).asSequence().chunked(1000).forEach({
        Log.info("cur_k " + k)
        k = k + it.size
    })
    Log.info("files.walk as seq chunk  " + k)

    val directoryFileObject = File(directoryToWatch)
    k = 0
    val c = directoryFileObject.walk().chunked(1000).forEach {
        Log.info("cur_k " + k)
         k = k + it.size }
    Log.info("file walk chunk " + k)
    
    val a = Files.walk(Paths.get(directoryToWatch)).toList()
    Log.info("files.walk " + a.size)


    Files.walk(Paths.get(directoryToWatch)).asSequence().chunked(1000).filter({ it.toString().endsWith("dataset.json")}).forEach { 
        Log.info("trying " + it)
        //insertSCDataset(it, mongoDBCollection, mongoDBCollectionExp, mongoDBCollectionMarkers)
        insertBulkSCDataset(it, mongoDBCollection, mongoDBCollectionExp, mongoDBCollectionMarkers)
        Log.info("completed " + it)
     }

    Log.info("Complete files list total length" + a.size)

     
    a.chunked(100).forEach{
     
        }



    mongoDBCollection.createIndex(Indexes.ascending("token", "selfPath"), IndexOptions().unique(true));
    mongoDBCollectionExp.createIndex(Indexes.ascending("token"), IndexOptions().unique(true));
    mongoDBCollectionMarkers.createIndex(index(mapOf(
        SCMarkerEntry::token to true,
        SCMarkerEntry::tableName to true,
        SCMarkerEntry::cluster to true,
        SCMarkerEntry::gene to true
    )), IndexOptions().unique(true));


    Files.createDirectories(Paths.get(tmpPath))
    generateGMTs(mongoDBCollection, tmpPath)
    generateAnnotationJSONs(mongoDBCollection, tmpPath)
    mongoDBCollection.renameCollection(MongoNamespace(database.name, mongoDBCollectionName ), RenameCollectionOptions().dropTarget(true))
    mongoDBCollectionExp.renameCollection(MongoNamespace(database.name, mongoDBCollectionExpressionName ), RenameCollectionOptions().dropTarget(true))
    mongoDBCollectionMarkers.renameCollection(MongoNamespace(database.name, mongoDBCollectionMarkersName ), RenameCollectionOptions().dropTarget(true))
    Runtime.getRuntime().exec("rm -r -f" + gmtOutDir)
    val cmd = "mv -f -u  " + tmpPath + " " + gmtOutDir
    Runtime.getRuntime().exec(cmd)
}

@ExperimentalTime
fun main(args: Array<String>) {
    if (args.size != 3) {
        Log.error("FS module was run without directory to watch argument, try again")
        return
    }


    val directoryToWatch = args[0]
    val gmtOutDir = args[1]
    val tmpPath = args[2]


    GlobalScope.launch { 
        while (true) {
            val begin = System.currentTimeMillis()
            CollectionCreator(directoryToWatch,  gmtOutDir , tmpPath + "/gmt/") 
            val end = System.currentTimeMillis()
            Log.info("Recreate mongo in" + (end-begin)/1000 + " sec." )
            delay(180000)

        }
    }


    while (true) {
        Thread.sleep(10000)
    }
}