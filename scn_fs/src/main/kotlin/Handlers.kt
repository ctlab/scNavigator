
import com.mongodb.client.MongoCollection
import de.jupf.staticlog.Log
import kotlinx.coroutines.channels.Channel
import org.litote.kmongo.deleteOneById
import org.litote.kmongo.eq
import org.litote.kmongo.findOne
import org.litote.kmongo.updateOneById
import ru.itmo.scn.core.SCDataset
import java.nio.file.Path



suspend fun fileChangeHandler(modifiedChannel: Channel<Path>,
                              mongoDBCollection: MongoCollection<SCDataset>) {
    while (true) {
        val modifiedPath = modifiedChannel.receive();
        Log.info("FILE MODIFIED: $modifiedPath")

        try {
            val scDataset = SCDataset.fromJsonFile(modifiedPath)
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
            Log.error("Error while parsing $modifiedPath. See exception text below")
            Log.error(e.message.toString())
        }
    }
}

suspend fun fileDeleteHandler(deletedChannel: Channel<Path>,
                              mongoDBCollection: MongoCollection<SCDataset>) {
    while (true) {
        val deletedPath = deletedChannel.receive();
        Log.info("FILE deleted: $deletedPath")

        try {
            val datasetQuery = mongoDBCollection.findOne(SCDataset::selfPath eq deletedPath.toString())
            if (datasetQuery == null) {
                Log.info("Dataset $deletedPath was not in the database. Doing nothing")
            } else {
                Log.info("Found $deletedPath in the dataset. Removing")
                mongoDBCollection.deleteOneById(datasetQuery._id)
            }
        } catch (e: Exception) {
            Log.error("Something went wrong while deleting $deletedPath. See exception text below")
            Log.error(e.message.toString())
        }

    }
}