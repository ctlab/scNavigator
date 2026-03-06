package ru.itmo.scn.fs

import kotlinx.coroutines.channels.Channel
import java.nio.file.WatchEvent
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.WatchService
import java.nio.file.WatchKey
import java.nio.file.StandardWatchEventKinds
import java.nio.file.Files
import io.ktor.application.*
import io.ktor.client.*
import io.ktor.client.engine.apache.*
import io.ktor.client.request.request
import io.ktor.client.statement.HttpStatement
import io.ktor.client.call.receive
import io.ktor.features.*
import io.ktor.gson.*
import io.ktor.http.*
import io.ktor.jackson.*
import io.ktor.request.*
import io.ktor.response.*
import io.ktor.routing.*
import io.ktor.server.engine.commandLineEnvironment
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.util.url
import de.jupf.staticlog.Log
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import java.text.DateFormat
import java.util.concurrent.ConcurrentHashMap
import org.slf4j.event.Level
import com.box.sdk.BoxAPIConnection;
import com.box.sdk.BoxFolder;
import com.box.sdk.BoxItem;
import com.box.sdk.BoxLogger;
import com.box.sdk.BoxUser;
import com.box.sdk.BoxWebHookSignatureVerifier
import com.box.sdk.BoxFile
import com.box.sdk.BoxTrash
import com.box.sdk.BoxAPIResponseException
import com.box.sdk.BoxCCGAPIConnection
import com.mongodb.client.MongoCollection
import kotlin.io.path.isDirectory
import kotlin.io.path.absolutePathString
import kotlin.io.path.name
import kotlin.io.path.exists
import ru.itmo.scn.fs.SyncWatcherRecursive
import org.litote.kmongo.regex

suspend fun boxUpdateReceiver( 
    outChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>,
    mongoDBCollection: MongoCollection<SCDataset>,
    watchService: WatchService,
    pathKeys:ConcurrentHashMap<String, WatchKey>,
    directoryToWatch:String,
    box_dir_path:String,
    webhook_first_key:String,
    webhook_sec_key:String,
    box_user_key:String, 
    box_user_secret:String,
    box_enterprise_id:String    
    ) {       
        //val api = BoxAPIConnection(api_key, api_secret) 
        val api:BoxAPIConnection
        if (box_user_secret.length == 0){
            Log.info("********USE DEV KEY ************")
            api = BoxAPIConnection(box_user_key)
        } else{

            api = BoxCCGAPIConnection.applicationServiceAccountConnection(box_user_key, box_user_secret, box_enterprise_id)
        }
        Log.info("Use first_key:"  + box_user_key)
        Log.info("Use second_key:"  + box_user_secret)
        embeddedServer(Netty, port = 8081) {
            install(Compression) {
                gzip {
                    priority = 1.0
                }
                deflate {
                    priority = 10.0
                    minimumSize(1024) // condition
                }
            }

            install(CallLogging) {
                level = Level.INFO
                filter { call -> call.request.path().startsWith("/") }
            }

            install(DefaultHeaders) {
                header("X-Engine", "Ktor") // will send this header with each response
            }

            install(ContentNegotiation) {
                jackson {
                }
            }

            val client = HttpClient(Apache) {
            }
            routing {

                install(ContentNegotiation) {
                    jackson()
                }

                route("scn_fs") {
                    post("box_updates"){

                        val verifier:BoxWebHookSignatureVerifier = BoxWebHookSignatureVerifier(webhook_first_key, webhook_sec_key);
                        val headers = call.request.headers
                        try {
                            val body = call.receive<String>();
                            val isValidMessage = verifier.verify(
                                headers.get("BOX-SIGNATURE-VERSION"),
                                headers.get("BOX-SIGNATURE-ALGORITHM"),
                                headers.get("BOX-SIGNATURE-PRIMARY"),
                                headers.get("BOX-SIGNATURE-SECONDARY"),
                                body.toString(),
                                headers.get("BOX-DELIVERY-TIMESTAMP")
                            )
                            if (isValidMessage) {
                                val msg:WebhookMessage = jacksonObjectMapper().readValue<WebhookMessage>(body)
                                Log.info("________________" + msg.trigger + "__________________")
                                Log.info(msg.source.toString())                            

                                val curItem:BoxItem = when (msg.source.type){
                                    "file" -> BoxFile(api, msg.source.id)
                                     else -> BoxFolder(api, msg.source.id)
                                }

                                val boxItemPath = try{
                                    getBoxPath(curItem)
                                } catch(e:BoxAPIResponseException){
                                    Log.info(e.toString())
                                    if (e.responseCode == 404){
                                        Log.info( curItem.id + " trashed by parent")
                                    }
                                    null
                                }
                                if (boxItemPath == null){
                                    Log.info("ignored")
                                    call.response.status(HttpStatusCode.OK) // ignore
                                } else {
                                    Log.info(boxItemPath.toString())
                                    val boxPrefix = Paths.get(box_dir_path)
                                    val fsPath = Paths.get(directoryToWatch)
                                    val rclonePath = boxPrefix.relativize(boxItemPath)
                                    Log.info("rclonePath path " + rclonePath.toString())
                                    //rclone rc vfs/forget file="test.json" fs="remote:test_dir"
                                    Log.info("local path " + fsPath.resolve(rclonePath).toString())
                                    when(msg.trigger){
                                        "FOLDER.TRASHED",  "FOLDER.DELETED" -> {
                                            SyncWatcherRecursive(
                                                fsPath.resolve(rclonePath), 
                                                StandardWatchEventKinds.ENTRY_DELETE, 
                                                watchService,
                                                pathKeys, 
                                                outChannel,
                                                mongoDBCollection
                                            )
                                            forget(rclonePath, client)
                                        }
                                        "FILE.TRASHED", "FILE.DELETED" -> {
                                            SyncWatcherOne(
                                                fsPath.resolve(rclonePath), 
                                                StandardWatchEventKinds.ENTRY_DELETE, 
                                                watchService,
                                                pathKeys, 
                                                outChannel
                                            )
                                            forget(rclonePath, client)
                                        }
                                        "FILE.RESTORED", "FILE.UPLOADED", "FILE.CREATED", "FOLDER.RESTORED" -> {
                                            forget(rclonePath, client)
                                            SyncWatcherOne(
                                                fsPath.resolve(rclonePath), 
                                                StandardWatchEventKinds.ENTRY_CREATE, 
                                                watchService,
                                                pathKeys,
                                                outChannel
                                            )
                                        }
                                        "FOLDER.CREATED" -> {
                                            forget(rclonePath, client)
                                            SyncWatcherRecursive (
                                                fsPath.resolve(rclonePath.toString()), 
                                                StandardWatchEventKinds.ENTRY_CREATE, 
                                                watchService,
                                                pathKeys, 
                                                outChannel,
                                                mongoDBCollection
                                            )
                                        }
                                        "FOLDER.RENAMED" -> {
                                            when(msg.additional_info){
                                                is RenameInfo -> {
                                                    val oldRclonePath = (rclonePath.parent ?: Paths.get("")).resolve(msg.additional_info.old_name)
                                                    SyncWatcherRecursive (
                                                        fsPath.resolve(oldRclonePath), 
                                                        StandardWatchEventKinds.ENTRY_DELETE, 
                                                        watchService, 
                                                        pathKeys, 
                                                        outChannel,
                                                        mongoDBCollection
                                                    )
                                                    forget(oldRclonePath, client)
                                                    forget(rclonePath, client)
                                                    SyncWatcherRecursive (
                                                        fsPath.resolve(rclonePath.toString()), 
                                                        StandardWatchEventKinds.ENTRY_CREATE, 
                                                        watchService,
                                                        pathKeys, 
                                                        outChannel,
                                                        mongoDBCollection
                                                    )

                                                }
                                                else -> {Log.info("Missed info for " + msg.source.id + ". Ignored." )}
                                            }
                                         // when(msg.additional_info){
                                            //     is RenameInfo -> Log.info("Rename! olda_name is " + msg.additional_info.old_name)
                                            //     is MoveInfo -> Log.info("Move !" + msg.additional_info.toString() )
                                            //     is EmptyInfo -> Log.info( "Info is empty")
                                            // }
                                        }
                                        "FILE.RENAMED" -> {
                                            when(msg.additional_info){
                                                is RenameInfo -> {
                                                    val oldRclonePath = (rclonePath.parent ?: Paths.get("")).resolve(msg.additional_info.old_name)
                                                    SyncWatcherOne (
                                                        fsPath.resolve(oldRclonePath), 
                                                        StandardWatchEventKinds.ENTRY_DELETE, 
                                                        watchService, pathKeys, 
                                                        outChannel
                                                    )
                                                    forget(oldRclonePath, client)
                                                    forget(rclonePath, client)
                                                    SyncWatcherOne (
                                                        fsPath.resolve(rclonePath), 
                                                        StandardWatchEventKinds.ENTRY_CREATE, 
                                                        watchService, pathKeys, 
                                                        outChannel
                                                    )

                                                }
                                                else -> {Log.info("Missed info for " + msg.source.id + ". Ignored." )}
                                            }
                                        }

                                        "FILE.MOVED" -> {
                                            when(msg.additional_info){
                                                is MoveInfo -> {
                                                    val beforePath = getBoxPath(BoxFolder(api, msg.additional_info.before.id)).resolve(boxItemPath.name)
                                                    val beforeRclonePath = boxPrefix.relativize(beforePath)
                                                    SyncWatcherOne (
                                                        fsPath.resolve(beforeRclonePath), 
                                                        StandardWatchEventKinds.ENTRY_DELETE, 
                                                        watchService, pathKeys, 
                                                        outChannel
                                                    )
                                                    forget(beforeRclonePath, client)
                                                }
                                                else -> {Log.info("Missed info for " + msg.source.id + ". Ignored." )}
                                            }
                                        }
                                        "FOLDER.MOVED" -> {
                                            when(msg.additional_info){
                                                is MoveInfo -> {
                                                    val beforePath = getBoxPath(BoxFolder(api, msg.additional_info.before.id)).resolve(boxItemPath.name)
                                                    val beforeRclonePath = boxPrefix.relativize(beforePath)
                                                    SyncWatcherRecursive (
                                                        fsPath.resolve(beforeRclonePath), 
                                                        StandardWatchEventKinds.ENTRY_DELETE, 
                                                        watchService, pathKeys, 
                                                        outChannel,
                                                        mongoDBCollection
                                                    )
                                                    forget(beforeRclonePath, client)
                                                }
                                                else -> {Log.info("Missed info for " + msg.source.id + ". Ignored." )}
                                            }
                                        }
                                    }
                                    
                                    call.response.status(HttpStatusCode.OK)
                                }

                            
                            } else {
                                // Message is invalid, reject it
                                call.response.status(HttpStatusCode.OK)
                                Log.info("POST:  BAD box message")
                                Log.info(body)
                            }
                        }
                        catch(e:Exception) {
                            Log.error(e.message.toString())
                            call.response.status(HttpStatusCode.OK)
                        }
                    }
                    get("test") {
                        Log.info(outChannel.toString())
                        call.respondText("You are here!")

                    }
                    get("check_box"){

                        var cur_item_info:BoxItem.Info? = try {
                            BoxFolder.getRootFolder(api).getInfo();
                        } catch (e:BoxAPIResponseException){
                            Log.info("api not working: " + e.toString())
                            call.respondText("Box api not working!")
                            null
                        } catch(e:Exception){
                            Log.info("Strange error" + e.toString())
                            call.respondText("Unknown error")
                            null
                        }
                        if (cur_item_info == null){
                            call.respondText("box root is null")
                            throw(Exception("Box root is null"))
                        } 
                        call.respondText("Box api seems to be working. Root folder:" + cur_item_info.name)
                    }

                }

                install(StatusPages) {
                    exception<AuthenticationException> {
                        call.respond(HttpStatusCode.Unauthorized)
                    }
                    exception<AuthorizationException> {
                        call.respond(HttpStatusCode.Forbidden)
                    }

                }
            }
        }.start(wait = true)

}
class AuthenticationException : RuntimeException()
class AuthorizationException : RuntimeException()



suspend fun forget(path:Path, client:HttpClient){
    try{
        val statement: HttpStatement = client.request("http://rclone_fs:5572/vfs/forget") {
            method = HttpMethod.Post
            url{
                parameters.append("file", path.toString())
            }
        }
        val response = statement.execute()
        Log.info(response.receive<String>())
    } catch(e:Exception){
        Log.info("fail forget: " + e.toString())
    }

}

fun getBoxPath(item:BoxItem):Path{
    val api = item.getAPI()

    val trash:BoxTrash  = BoxTrash(api);   
    var cur_item_info:BoxItem.Info? = try {
                                            when (item){
                                                is BoxFile -> { trash.getFileInfo(item.id)}
                                                else ->  { trash.getFolderInfo(item.id)}
                                            }
                                        } catch (e:BoxAPIResponseException){
                                            item.getInfo()
                                        } catch(e:Exception){
                                            Log.info("Strange error" + e.toString())
                                            null
                                        }
    if (cur_item_info == null){
        throw(Exception("Error! Unable to get info for id: " + item.id ))
    } 
    val name_list = mutableListOf<String>(cur_item_info.name) 

    while(true){
       
        val parent_id = cur_item_info!!.getParent().getID()
        cur_item_info = try{
            trash.getFolderInfo(parent_id)
        } catch (e:BoxAPIResponseException){
            BoxFolder(api, parent_id).getInfo()
        } catch(e:Exception){
            null
        }
        if (cur_item_info != null){
            //Log.info("Item status: " + cur_item_info.getItemStatus())
            name_list.add(0, cur_item_info.name)
            if (cur_item_info.getItemStatus().compareTo("active") == 0){
                break
            }
        }
        else{
            Log.error("Box api doesn't work for id " + parent_id)
            break
        }
    }
    cur_item_info?.pathCollection?.forEachIndexed { index, it ->
        name_list.add( index, it.name)
    }
    return Paths.get( "" ,*name_list.toTypedArray())


}


// assume that everything that cache contain file tree ( already for create and still for delete) 
suspend fun SyncWatcherRecursive(fullPath:Path, 
                event_kind:WatchEvent.Kind<Path>, 
                watchService:WatchService, 
                pathKeys:ConcurrentHashMap<String, WatchKey>,
                outChannel:Channel<Pair<Path, WatchEvent.Kind<Path>>>,
                mongoDBCollection: MongoCollection<SCDataset>){
    Log.info("recursive sync " + fullPath.toString())
    
    if (fullPath.exists()){   
        Log.info("folder cached")     
        for (file in Files.walk(fullPath) ) {
            SyncWatcherOne(file, event_kind, watchService, pathKeys, outChannel)
        }    
    } else{
        Log.info("folder not cached. Try use mongo.")
        updateKeys(fullPath, event_kind, watchService, pathKeys)
        val regexp = "^"+ fullPath + "/";
        val datasets = mongoDBCollection.find( SCDataset::selfPath regex regexp)
        val dataset_files = datasets.mapNotNull { it.selfPath }.map{ Paths.get(it) }
        dataset_files.forEach({
            var folder = it.parent
            while(!folder.equals(fullPath)){
                updateKeys(folder, event_kind, watchService, pathKeys)
                folder = folder.parent
            }    
            SyncWatcherOne(it, event_kind, watchService, pathKeys, outChannel)})
    }
}
suspend fun SyncWatcherOne(file:Path, 
                            event_kind:WatchEvent.Kind<Path>, 
                            watchService:WatchService, 
                            pathKeys:ConcurrentHashMap<String, WatchKey>,
                            outChannel:Channel<Pair<Path, WatchEvent.Kind<Path>>>){
    Log.info("sync " + file.toString())
    if (file.isDirectory()) {
        updateKeys(file, event_kind,  watchService, pathKeys) 
    } else {
        // Log.info("SENDING EVENT TO FSReciever")
        outChannel.send(Pair(file, event_kind));
    }
}
fun updateKeys(file:Path, 
event_kind:WatchEvent.Kind<Path>, 
watchService:WatchService, 
pathKeys:ConcurrentHashMap<String, WatchKey>){
    when (event_kind) {
        StandardWatchEventKinds.ENTRY_CREATE -> {
            pathKeys[file.absolutePathString()] = file.register(watchService,
                StandardWatchEventKinds.ENTRY_CREATE,
                StandardWatchEventKinds.ENTRY_MODIFY,
                StandardWatchEventKinds.ENTRY_DELETE
            )
            Log.info("Now also watching directory ${file.toString()}")
        }
        StandardWatchEventKinds.ENTRY_DELETE -> {
            pathKeys[file.absolutePathString()]?.cancel()
            pathKeys.remove(file.absolutePathString())
            Log.info("Directory ${file.toString()} is deleted, no longer watching it")
        }
    }
}

