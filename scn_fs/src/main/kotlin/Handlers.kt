package ru.itmo.scn.fs

import com.mongodb.client.MongoCollection
import de.jupf.staticlog.Log
import kotlinx.coroutines.channels.Channel
import org.litote.kmongo.deleteOneById
import org.litote.kmongo.eq
import org.litote.kmongo.findOne
import org.litote.kmongo.updateOneById

import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths


fun insertOrUpdateSCDataset(path: Path, mongoDBCollection: MongoCollection<SCDataset>) {
    try {
        val scDataset = SCDataset.fromJsonFile(path)
        val datasetQuery = mongoDBCollection.findOne(SCDataset::token eq scDataset.token)

        if (datasetQuery == null) {
            Log.info("Inserting the dataset ${scDataset.token} into the mongo database")
            mongoDBCollection.insertOne(scDataset)
        } else {
            if (datasetQuery.selfPath == scDataset.selfPath) {
                Log.info("Updating the dataset ${scDataset.token} in the database")
                mongoDBCollection.updateOneById(datasetQuery._id, scDataset)
            } else {
                Log.error("Dataset with token ${scDataset.token} already exists: ${datasetQuery.selfPath}. Not updating")
            }
        }
    } catch (e: Exception) {
        Log.error("Error while parsing $path. See exception text below")
        Log.error(e.message.toString())
    }
}

fun deleteSCDataset(path: Path, mongoDBCollection: MongoCollection<SCDataset>) {
    try {
        val datasetQuery = mongoDBCollection.findOne(SCDataset::selfPath eq path.toString())
        if (datasetQuery == null) {
            Log.info("Dataset $path was not in the database. Doing nothing")
        } else {
            Log.info("Found $path in the dataset. Removing")
            mongoDBCollection.deleteOneById(datasetQuery._id)
        }
    } catch (e: Exception) {
        Log.error("Something went wrong while deleting $path. See exception text below")
        Log.error(e.message.toString())
    }
}

suspend fun fileChangeHandler(modifiedChannel: Channel<Path>,
                              mongoDBCollection: MongoCollection<SCDataset>) {
    while (true) {
        val modifiedPath = modifiedChannel.receive();
        Log.info("FILE MODIFIED: $modifiedPath")


        val fileName = modifiedPath.fileName.toString()
        val datasetDir = File(modifiedPath.toString()).parentFile.parentFile.path
        val dirName = File(modifiedPath.toString()).parentFile.name

        if (fileName == DATASET_FILE_NAME) {
            insertOrUpdateSCDataset(modifiedPath, mongoDBCollection)
        } else if (dirName == FILES_FOLDER_NAME) {
            val datasetPath = Paths.get(datasetDir, DATASET_FILE_NAME)
            Log.info(datasetPath.toString())
            if (!Files.exists(datasetPath)) continue
            insertOrUpdateSCDataset(datasetPath, mongoDBCollection)
        }
    }
}

suspend fun fileDeleteHandler(deletedChannel: Channel<Path>,
                              mongoDBCollection: MongoCollection<SCDataset>) {
    while (true) {
        val deletedPath = deletedChannel.receive();
        Log.info("FILE deleted: $deletedPath")

        val fileName = deletedPath.fileName.toString()
        val dirChanged = File(deletedPath.toString()).parentFile.path
        val dirName = File(deletedPath.toString()).parentFile.name

        if (fileName == DATASET_FILE_NAME) {
            deleteSCDataset(deletedPath, mongoDBCollection)
        } else if (dirName == FILES_FOLDER_NAME) {
            val datasetPath = Paths.get(dirChanged, DATASET_FILE_NAME)
            if (!Files.exists(datasetPath)) continue
            insertOrUpdateSCDataset(datasetPath, mongoDBCollection)
        }
    }
}