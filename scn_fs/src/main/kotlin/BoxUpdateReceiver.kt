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
    otherArgs: Array<String>) {   
        
        val webhook_key = "xnZXCpICEjEQb5gKRcfaJ2TcM1jzsEZS";
        val webhoor_sec_key = "PpGelWNY56S2yBAhuHvQxxFEGoR7IV9y";
        val verifier:BoxWebHookSignatureVerifier = BoxWebHookSignatureVerifier(webhook_key, webhoor_sec_key);

        val api_key = "aprdjeuciqnlp1yo9d4ttwpy2zgb7ibd"
        val api_secret = "PyU8Kq4ZpboQ7GEGzGmeZxaF84JHadEg"
        val api = BoxAPIConnection(api_key, api_secret) 
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
                                Log.info("POST:  success")
                                Log.info(body.toString())
                                
                                val msg:WebhookMessage = jacksonObjectMapper().readValue<WebhookMessage>(body)
                                
                                Log.info(msg.trigger)
                                Log.info("------------------------")
                                Log.info(msg.source.toString())

                                msg.source.path?.let{it.path_entries.forEach { item -> Log.info(item) }}
                                //body.source.path.entries.forEach({item -> Log.info(item.name)})
                            
                                Log.info(msg.additional_info.toString())
                                when(msg.additional_info){
                                    is RenameInfo -> Log.info("Rename! olda_name is " + msg.additional_info.old_name)
                                    is MoveInfo -> Log.info("Move !" + msg.additional_info.toString() )
                                    is EmptyInfo -> Log.info( "Info is empty")
                                }
                          
                                Log.info("+++++++++++++++++++++++++++++")
                          
                                when(msg.source.type){
                                    "file" -> {
                                        val test_file = BoxFile(api, msg.source.id)
                                        val p_test = getBoxPath(test_file)
                                    }
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


        io.ktor.server.netty.EngineMain.main(otherArgs)
                    
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
                                            item.getInfo()
                                        } catch(e:Exception){
                                            null
                                        }
    if (cur_item_info == null){
        throw(Exception("Error! Unable to get info for id: " + item.id ))
    } 
    val name_list = mutableListOf<String>(cur_item_info.name) 

    while(true){
        val parent_id = cur_item_info!!.getParent().getID()
        try{
            cur_item_info = trash.getFolderInfo(parent_id)
            name_list.add(0, cur_item_info.name)
        } catch (e:BoxAPIResponseException){
            cur_item_info = BoxFolder(api, parent_id).getInfo()
            break
        } 
    }
    cur_item_info?.pathCollection?.forEach({
        name_list.add(0, it.name)
    })
    return Paths.get( "" ,*name_list.toTypedArray())


}