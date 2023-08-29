package ru.itmo.scn.fs

import kotlinx.coroutines.channels.Channel
import java.nio.file.WatchEvent
import java.nio.file.Path
import java.nio.file.Paths
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


suspend fun boxUpdateReceiver( // boxDir:Path,
    outChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>,
    first_key:String, 
    second_key:String,
    ) {   
        
        val webhook_key = "xnZXCpICEjEQb5gKRcfaJ2TcM1jzsEZS";
        val webhoor_sec_key = "PpGelWNY56S2yBAhuHvQxxFEGoR7IV9y";
        val verifier:BoxWebHookSignatureVerifier = BoxWebHookSignatureVerifier(webhook_key, webhoor_sec_key);

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
                                val boxItemPath = getBoxPath(curItem)
                                when(msg.trigger){
                                    "FOLDER.TRASHED", "FILE.TRASHED"-> {}
                                    "FOLDER.UPLOADED", "FILE.UPLOADED" -> {}
                                    "FOLDER.RENAMED", "FILE.RENAMED" -> {}
                                    "FOLDER.MOVED", "FILE.MOVED" -> {}
                                }



                                call.respondText("OK")
                                
                            } else {
                                // Message is invalid, reject it
                                Log.info("POST:  BAD box message")
                                call.respond(HttpStatusCode.BadRequest)
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

fun getBoxPath(item:BoxItem):Path{
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