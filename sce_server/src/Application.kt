package ru.itmo.sce.server

import io.ktor.application.*
import io.ktor.response.*
import io.ktor.request.*
import io.ktor.routing.*
import io.ktor.http.*
import kotlinx.html.*
import kotlinx.css.*
import io.ktor.http.content.*
import io.ktor.features.*
import org.slf4j.event.*
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.module.kotlin.readValue
import com.mongodb.client.MongoDatabase
import io.ktor.jackson.*
import io.ktor.client.*
import io.ktor.client.engine.apache.*
import ru.itmo.sce.core.SCDataset
import org.litote.kmongo.*
import de.jupf.staticlog.Log
import ru.itmo.sce.core.H5ExpressionDataset
import java.io.File
import java.net.URI
import java.nio.file.Paths



val mongoDBHost =  System.getenv("MONGODB_HOST") ?: "127.0.0.1:27017"
val mongoDB = System.getenv("MONGODB_DATABASE") ?: "sce"
val mongoDBCollection = System.getenv("MONGODB_COLLECTION") ?: "datasets"
val pathToProd = System.getenv("PROD_PATH") ?: "/home/askmebefore/sce_new/sce_js/prod"

val client = KMongo.createClient(mongoDBHost)
val database: MongoDatabase = client.getDatabase(mongoDB)
val pathways: Map<String, List<String>> = ObjectMapper().readValue(object {}.javaClass.getResource("/pathways.json"))

fun main(args: Array<String>) {
    while (!database.listCollectionNames().contains(mongoDBCollection)) {
        Log.info("Collection $mongoDBCollection does not exist yet, waiting")
        Thread.sleep(5000L)


    }
    io.ktor.server.netty.EngineMain.main(args)
}



suspend fun checkToken(call: ApplicationCall): SCDataset? {
    val queryParameters = call.request.queryParameters
    val token = queryParameters["token"]
    return if (token === null) {
        call.respond(HttpStatusCode.BadRequest)
        null
    } else {
        val collection = database.getCollection<SCDataset>(mongoDBCollection)
        val dataset = collection.findOne(SCDataset::token eq token)
        if (dataset === null) {
            call.respond(HttpStatusCode.NotFound)
            null
        } else {
            dataset
        }
    }
}

@Suppress("unused") // Referenced in application.conf
@kotlin.jvm.JvmOverloads
fun Application.module(testing: Boolean = false) {
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
        // Static feature. Try to access `/static/ktor_logo.svg`
        static("/") {
            files(pathToProd)
            default(Paths.get(pathToProd, "index.html").toString())
        }

        route("sce") {
            get("getPublicDatasets") {
                val collection = database.getCollection<SCDataset>(mongoDBCollection)
                val datasets = collection.find(SCDataset::public eq true)
                call.respond(datasets.toMutableList())
            }

            get("getDataset") {
                val dataset = checkToken(call)
                if (dataset !== null) {
                    call.respond(dataset)
                }
            }

            get("checkDataset") {
                val dataset = checkToken(call)
                if (dataset !== null) {
                    call.respond(HttpStatusCode.OK, "Exists")
                }
            }

            get("getFiles") {
                val dataset = checkToken(call)
                if (dataset !== null) {
                    val files = dataset.files
                    val fileMaps = files.map {
                        val file = File(it)
                        val path = file.toPath()
                        mapOf(
                                "name" to path.fileName.toString(),
                                "path" to it,
                                "size" to file.length(),
                                "mtime" to file.lastModified()
                        )
                    }
                    call.respond(fileMaps)
                }
            }

            get("getPathwayNames") {
                call.respond(pathways.keys)
            }

            get("getPathway") {
                val dataset = checkToken(call)
                val pathway = call.request.queryParameters["pathway"]
                var pathwayGenes = pathways[pathway]

                if (pathwayGenes !== null) {
                    if (dataset !== null) {
                        val expFile = dataset.expressionFile
                        val filePath = dataset.expH5Table

                        if (filePath === null || expFile === null) {
                            call.respond(HttpStatusCode.NotFound, "No expression data for this dataset")
                        } else {
                            val expressionDataset = H5ExpressionDataset.getDataset(filePath)
                            val expData: Map<String, Any> = ObjectMapper().readValue(File(expFile).readText())
                            var allGenes = expData["features"]


                            when (allGenes) {
                                null -> {
                                    call.respond(HttpStatusCode.InternalServerError)
                                }
                                else -> {
                                    allGenes as List<String>
                                    pathwayGenes = pathwayGenes.map { it.toLowerCase() }
                                    allGenes = allGenes.map { it.toLowerCase() }
                                    val pathwayIds = pathwayGenes.map { (allGenes as List<String>).indexOf(it) }.filter { it >= 0}
                                    call.respond(expressionDataset.getFeaturesAverage(pathwayIds))
                                }
                            }



                        }
                    }
                }
            }

            get("getGeneset") {
                val dataset = checkToken(call)
                val genesString = call.request.queryParameters["genes"]

                if (genesString !== null) {
                    if (dataset !== null) {
                        val expFile = dataset.expressionFile
                        val filePath = dataset.expH5Table

                        if (filePath === null || expFile === null) {
                            call.respond(HttpStatusCode.NotFound, "No expression data for this dataset")
                        } else {
                            val expressionDataset = H5ExpressionDataset.getDataset(filePath)
                            val expData: Map<String, Any> = ObjectMapper().readValue(File(expFile).readText())
                            var allGenes = expData["features"]
                            var genes: List<String> = ObjectMapper().readValue(genesString)

                            when (allGenes) {
                                null -> {
                                    call.respond(HttpStatusCode.InternalServerError)
                                }
                                else -> {
                                    allGenes as List<String>
                                    genes = genes.map { it.toLowerCase() }
                                    allGenes = (allGenes as List<String>).map { it.toLowerCase() }
                                    val pathwayIds = genes.map { (allGenes as List<String>).indexOf(it) }.filter { it >= 0}
                                    call.respond(expressionDataset.getFeaturesAverage(pathwayIds))
                                }
                            }



                        }
                    }
                }
            }

            get("getExpressionData") {
                val dataset = checkToken(call)
                val gene = call.request.queryParameters["gene"]?.toInt()
                if (gene !== null) {
                    if (dataset !== null) {
                        val filePath = dataset.expH5Table
                        if (filePath === null) {
                            call.respond(HttpStatusCode.NotFound, "No expression data for this dataset")
                        } else {
                            val expressionDataset = H5ExpressionDataset.getDataset(filePath)
                            val values = expressionDataset.getFeatureByIndex(gene)
                            call.respond(values)
                        }

                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, "No gene specified")
                }

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
}

class AuthenticationException : RuntimeException()
class AuthorizationException : RuntimeException()

fun FlowOrMetaDataContent.styleCss(builder: CSSBuilder.() -> Unit) {
    style(type = ContentType.Text.CSS.toString()) {
        +CSSBuilder().apply(builder).toString()
    }
}

fun CommonAttributeGroupFacade.style(builder: CSSBuilder.() -> Unit) {
    this.style = CSSBuilder().apply(builder).toString().trim()
}

suspend inline fun ApplicationCall.respondCss(builder: CSSBuilder.() -> Unit) {
    this.respondText(CSSBuilder().apply(builder).toString(), ContentType.Text.CSS)
}
