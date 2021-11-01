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


fun insertOrUpdateSCDataset(path: Path,
                            mongoDBCollection: MongoCollection<SCDataset>,
                            mongoDBCollectionExp: MongoCollection<SCDatasetExpression>) {
    try {
        val scDataset = SCDataset.fromJsonFile(path)
        val datasetQuery = mongoDBCollection.findOne(SCDataset::token eq scDataset.token)
        var updated = false

        if (datasetQuery == null) {
            Log.info("Inserting the dataset ${scDataset.token} into the mongo database")
            mongoDBCollection.insertOne(scDataset)
            updated = true
        } else {
            if (datasetQuery.selfPath == scDataset.selfPath) {
                Log.info("Updating the dataset ${scDataset.token} in the database")
                mongoDBCollection.updateOneById(datasetQuery._id, scDataset)
                updated = true
            } else {
                Log.error("Dataset with token ${scDataset.token} already exists: ${datasetQuery.selfPath}. Not updating")
            }
        }

        if (updated) {
            if (scDataset.expressionFile !== null) {
                val scExp = SCDatasetExpression.fromJsonFile(scDataset.expressionFile, scDataset.token)
                when (val datasetExpQuery = mongoDBCollectionExp.findOne(SCDatasetExpression::token eq scExp.token)) {
                    null -> {
                        Log.info("Inserting the expression info for ${scExp.token} into the mongo database")
                        mongoDBCollectionExp.insertOne(scExp)
                    }
                    else -> {
                        Log.info("Updating the expression info for dataset ${scExp.token} in the database")
                        mongoDBCollectionExp.updateOneById(datasetExpQuery._id, scExp)
                    }

                }                }
        }


    } catch (e: Exception) {
        Log.error("Error while parsing $path. See exception text below")
        Log.error(e.message.toString())
    }
}

fun deleteSCDataset(path: Path,
                    mongoDBCollection: MongoCollection<SCDataset>,
                    mongoDBCollectionExp: MongoCollection<SCDatasetExpression>)  {
    try {
        val datasetQuery = mongoDBCollection.findOne(SCDataset::selfPath eq path.toString())
        if (datasetQuery == null) {
            Log.info("Dataset $path was not in the database. Doing nothing")
        } else {
            Log.info("Found $path in the dataset. Removing")
            mongoDBCollection.deleteOneById(datasetQuery._id)
            mongoDBCollectionExp.deleteOne(SCDatasetExpression::token eq datasetQuery.token)
        }



    } catch (e: Exception) {
        Log.error("Something went wrong while deleting $path. See exception text below")
        Log.error(e.message.toString())
    }
}

suspend fun fileChangeHandler(modifiedChannel: Channel<Path>,
                              mongoDBCollection: MongoCollection<SCDataset>,
                              mongoDBCollectionExp: MongoCollection<SCDatasetExpression>) {
    while (true) {
        val modifiedPath = modifiedChannel.receive();
        Log.info("FILE MODIFIED: $modifiedPath")


        val fileName = modifiedPath.fileName.toString()
        val datasetDir = File(modifiedPath.toString()).parentFile.parentFile.path
        val dirName = File(modifiedPath.toString()).parentFile.name

        if (fileName == DATASET_FILE_NAME) {
            insertOrUpdateSCDataset(modifiedPath, mongoDBCollection, mongoDBCollectionExp)
        } else if (dirName == FILES_FOLDER_NAME) {
            val datasetPath = Paths.get(datasetDir, DATASET_FILE_NAME)
            Log.info(datasetPath.toString())
            if (!Files.exists(datasetPath)) continue
            insertOrUpdateSCDataset(datasetPath, mongoDBCollection, mongoDBCollectionExp)
        }
    }
}

suspend fun fileDeleteHandler(deletedChannel: Channel<Path>,
                              mongoDBCollection: MongoCollection<SCDataset>,
                              mongoDBCollectionExp: MongoCollection<SCDatasetExpression>) {
    while (true) {
        val deletedPath = deletedChannel.receive();
        Log.info("FILE deleted: $deletedPath")

        val fileName = deletedPath.fileName.toString()
        val dirChanged = File(deletedPath.toString()).parentFile.path
        val dirName = File(deletedPath.toString()).parentFile.name

        if (fileName == DATASET_FILE_NAME) {
            deleteSCDataset(deletedPath, mongoDBCollection, mongoDBCollectionExp)
        } else if (dirName == FILES_FOLDER_NAME) {
            val datasetPath = Paths.get(dirChanged, DATASET_FILE_NAME)
            if (!Files.exists(datasetPath)) continue
            insertOrUpdateSCDataset(datasetPath, mongoDBCollection, mongoDBCollectionExp)
        }
    }
}