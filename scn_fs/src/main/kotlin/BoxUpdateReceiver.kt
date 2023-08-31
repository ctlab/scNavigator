package ru.itmo.scn.fs

import kotlinx.coroutines.channels.Channel
import java.nio.file.WatchEvent
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.WatchService
import java.nio.file.WatchKey
import java.nio.file.StandardWatchEventKinds
import io.ktor.application.*
import io.ktor.client.*
import io.ktor.client.engine.apache.*
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
import kotlin.io.path.isDirectory
import kotlin.io.path.absolutePathString


suspend fun boxUpdateReceiver( // boxDir:Path,
    outChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>,
    watchService: WatchService,
    pathKeys:ConcurrentHashMap<String, WatchKey>,
    directoryToWatch:String,
    box_dir_path:String,
    first_key:String, 
    second_key:String    
    ) {   

        val webhook_key = "2APuppKR82qdck4G527dpelA7D1YHBTM";
        val webhook_sec_key = "hNL8IZQWEN7geXDF9N4mHHMDVWf33gUv";
        val verifier:BoxWebHookSignatureVerifier = BoxWebHookSignatureVerifier(webhook_key, webhook_sec_key);

        //val api = BoxAPIConnection(api_key, api_secret) 
        val api:BoxAPIConnection
        if (second_key.length == 0){
            api = BoxAPIConnection(first_key)
        } else{
            api = BoxAPIConnection(first_key, second_key)
        }
        Log.info("Use first_key:"  + first_key)
        Log.info("Use second_key:"  + second_key)
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
                    post("file_updates"){
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
                            );


                            if (isValidMessage) {
                                // Message is valid, handle it
                                Log.info(body.toString())
                                Log.info("------------------------")
                                val msg:WebhookMessage = jacksonObjectMapper().readValue<WebhookMessage>(body)
                                Log.info("________________" + msg.trigger + "__________________")
                                Log.info(msg.source.toString())                            
                                Log.info(msg.additional_info.toString())
                                when(msg.additional_info){
                                    is RenameInfo -> Log.info("Rename! olda_name is " + msg.additional_info.old_name)
                                    is MoveInfo -> Log.info("Move !" + msg.additional_info.toString() )
                                    is EmptyInfo -> Log.info( "Info is empty")
                                }
                                Log.info("+++++++++++++++++++++++++++++")
                                val curItem:BoxItem = when (msg.source.type){
                                    "file" -> BoxFile(api, msg.source.id)
                                     else -> BoxFolder(api, msg.source.id)
                                }
                                val boxItemPath = getBoxPathsdf(curItem)
                                val boxPrefix = Paths.get(box_dir_path)
                                val fsPath = Paths.get(directoryToWatch)
                                val rclonePath = boxItemPath.relativize(boxPrefix)

                                Log.info("rclonePath path " + rclonePath.toString())

                                //rclone rc vfs/forget file="test.json" fs="remote:test_dir"
                                when(msg.trigger){
                                    "FILE.TRASHED"-> {
                                        val cmd = "rclone rc vfs/forget file='" + rclonePath +"' fs='remote:test_dir'"
                                        Runtime.getRuntime().exec(cmd)
                                        mySyncWatcher(fsPath.resolve(rclonePath.toString()) , 
                                        StandardWatchEventKinds.ENTRY_DELETE, watchService, pathKeys, outChannel)
                                    }
                                    "FOLDER.TRASHED"-> {}
                                    "FOLDER.UPLOADED", "FILE.UPLOADED" -> {}
                                    "FOLDER.RENAMED", "FILE.RENAMED" -> {}
                                    "FOLDER.MOVED", "FILE.MOVED" -> {}
                                    "FOLDER.CREATED", "FILE.CREATED" -> {}
                                }



                                call.respondText("OK")

                            } else {
                                // Message is invalid, reject it
                                Log.info("POST:  BAD box message")
                                Log.info(body)
                                call.respondText("OK")
                            }
                    }
                    catch(e:Exception) {

                        Log.error(e.message.toString())


                    }
                    }
                    get("test") {
                        Log.info(outChannel.toString())
                        call.respondText("You are here!")

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


fun getBoxPathsdf(item:BoxItem):Path{
    val api = item.getAPI()
    val trash:BoxTrash  = BoxTrash(api);   
    var cur_item_info:BoxItem.Info? = try {
                                            when (item){
                                                is BoxFile -> trash.getFileInfo(item.id)
                                                else ->  trash.getFolderInfo(item.id)
                                            }
                                        } catch (e:BoxAPIResponseException){
                                            Log.info("exist")
                                            item.getInfo()
                                        } catch(e:Exception){
                                            null
                                        }
    if (cur_item_info == null){
        throw(Exception("Error! Unable to get info for id: " + item.id ))
    } 
    //Log.info("____first name_ : " + cur_item_info.name)
    val name_list = mutableListOf<String>(cur_item_info.name) 
    while(true){
        val parent_id = cur_item_info!!.getParent().getID()
        //Log.info("try id: " + parent_id)
        cur_item_info = try{
           trash.getFolderInfo(parent_id)
        } catch (e:BoxAPIResponseException){
           BoxFolder(api, parent_id).getInfo()
        } catch(e:Exception){
            null
        }
        if (cur_item_info != null){
            //Log.info("____cur name_ : " + cur_item_info.name)
            //Log.info("Item status: " + cur_item_info.getItemStatus())
            name_list.add(0, cur_item_info.name)
            if (cur_item_info.getItemStatus().compareTo("active") == 0){
                //Log.info("found not trashed")
                break
            }
        }
        else{
            Log.error("Box api doesn't work for id " + parent_id)
            break
        }
    }
    cur_item_info?.pathCollection?.forEachIndexed { index, it ->
        //Log.info("exist-tail name " + it.name)
        name_list.add( index, it.name)
    }
    //Log.info("final list: " + name_list.toString())
    return Paths.get( "" ,*name_list.toTypedArray())


}



suspend fun mySyncWatcher(fullPath:Path, 
                event_kind:WatchEvent.Kind<Path>, 
                watchService:WatchService, 
                pathKeys:ConcurrentHashMap<String, WatchKey>,
                outChannel:Channel<Pair<Path, WatchEvent.Kind<Path>>>){
            if (fullPath.isDirectory()) {
                when (event_kind) {
                    StandardWatchEventKinds.ENTRY_CREATE -> {
                        pathKeys[fullPath.absolutePathString()] = fullPath.register(watchService,
                            StandardWatchEventKinds.ENTRY_CREATE,
                            StandardWatchEventKinds.ENTRY_MODIFY,
                            StandardWatchEventKinds.ENTRY_DELETE
                        )
                        Log.info("Now also watching directory ${fullPath.toString()}")
                    }
                    StandardWatchEventKinds.ENTRY_DELETE -> {
                        pathKeys[fullPath.absolutePathString()]?.cancel()
                        pathKeys.remove(fullPath.absolutePathString())
                        Log.info("Directory ${fullPath.toString()} is deleted, no longer watching it")
                    }
                }
            } else {
                // Log.info("SENDING EVENT TO FSReciever")
                outChannel.send(Pair(fullPath, event_kind));
            }
}