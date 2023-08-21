package ru.itmo.scn.fs

import kotlinx.coroutines.channels.Channel
import java.nio.file.WatchEvent
import java.nio.file.Path
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
import com.fasterxml.jackson.databind.SerializationFeature
import java.text.DateFormat
import org.slf4j.event.Level
import com.box.sdk.BoxAPIConnection;
import com.box.sdk.BoxFolder;
import com.box.sdk.BoxItem;
import com.box.sdk.BoxLogger;
import com.box.sdk.BoxUser;
import com.box.sdk.BoxWebHookSignatureVerifier


suspend fun boxUpdateReceiver( // boxDir:Path,
    outChannel: Channel<Pair<Path, WatchEvent.Kind<Path>>>,
    otherArgs: Array<String>) {   
        
        val primaryKey = "R3KnKQSiCgq9gCH8hiFPqfR6WWKSolYE";
        val secondaryKey = "cXqXlBx6LAeOxfBb7rWWMy8u5Ojz4lEu";

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
                    enable(SerializationFeature.INDENT_OUTPUT)
                }
            }
        
            val client = HttpClient(Apache) {
            }
            routing {

                install(ContentNegotiation) {
                    gson {
                        setDateFormat(DateFormat.LONG)
                        setPrettyPrinting()
                    }
                }
        
                route("scn_fs") {
                    post("file_updates"){
                        val headers = call.request.headers
                        val body = call.receive<String>();
                        val verifier:BoxWebHookSignatureVerifier = BoxWebHookSignatureVerifier(primaryKey, secondaryKey);
                        val isValidMessage = verifier.verify(
                            headers.get("BOX-SIGNATURE-VERSION"),
                            headers.get("BOX-SIGNATURE-ALGORITHM"),
                            headers.get("BOX-SIGNATURE-PRIMARY"),
                            headers.get("BOX-SIGNATURE-SECONDARY"),
                            body,
                            headers.get("BOX-DELIVERY-TIMESTAMP")
                        );


                        if (isValidMessage) {
                            // Message is valid, handle it
                            Log.info("POST:  success" +)
                            call.respondText("OK")
                        } else {
                            // Message is invalid, reject it
                            Log.info("POST:  BAD request")
                            
                        }
                        Log.info("HEADERS: ")
                        headers.forEach { name:String, value:List<String> -> Log.info(name + "     :    " + value) }
                        
                        Log.info("Cookies: ")
                        Log.info(call.request.cookies.toString())
                        Log.info("PARAMS: ")
                        call.request.queryParameters.forEach { name:String, value:List<String> -> Log.info(name + "     :    " + value) }
                        Log.info("BODY :")
                        Log.info(body)
                        call.respondText("OK")
                        Log.info("=======================================================================================")

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