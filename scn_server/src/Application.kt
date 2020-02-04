package ru.itmo.scn.server

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.module.kotlin.readValue
import com.mongodb.client.MongoDatabase
import de.jupf.staticlog.Log
import io.ktor.application.Application
import io.ktor.application.ApplicationCall
import io.ktor.application.call
import io.ktor.application.install
import io.ktor.client.HttpClient
import io.ktor.client.engine.apache.Apache
import io.ktor.features.*
import io.ktor.gson.gson
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.jackson.jackson
import io.ktor.request.path
import io.ktor.request.receive
import io.ktor.response.respond
import io.ktor.response.respondText
import io.ktor.routing.get
import io.ktor.routing.post
import io.ktor.routing.route
import io.ktor.routing.routing
import kotlinx.css.CSSBuilder
import kotlinx.html.CommonAttributeGroupFacade
import kotlinx.html.FlowOrMetaDataContent
import kotlinx.html.style
import org.litote.kmongo.KMongo
import org.litote.kmongo.eq
import org.litote.kmongo.findOne
import org.litote.kmongo.getCollection
import org.slf4j.event.Level
import ru.itmo.scn.core.H5ExpressionDataset
import ru.itmo.scn.core.SCDataset
import java.io.File
import java.text.DateFormat
import ru.itmo.scn.server.BulkGeneSearchBody


val mongoDBHost: String =  System.getenv("MONGODB_HOST") ?: "mongo:27017"
val mongoDB: String = System.getenv("MONGODB_DATABASE") ?: "scn"
val mongoDBCollection: String = System.getenv("MONGODB_COLLECTION") ?: "datasets"
val pathToProd: String = System.getenv("PROD_PATH") ?: "/scn/scn_js/prod"

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


suspend fun checkToken(call: ApplicationCall, token: String?): SCDataset? {
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

suspend fun checkToken(call: ApplicationCall): SCDataset? {
    val queryParameters = call.request.queryParameters
    val token = queryParameters["token"]
    return checkToken(call, token)
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

        install(ContentNegotiation) {
            gson {
                setDateFormat(DateFormat.LONG)
                setPrettyPrinting()
            }
        }

        route("scn") {
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

            post("getGeneset") {
                val body = call.receive<BulkGeneSearchBody>();
                val dataset = checkToken(call, body.token)

                if (dataset !== null) {
                    val expFile = dataset.expressionFile
                    val filePath = dataset.expH5Table

                    if (filePath === null || expFile === null) {
                        call.respond(HttpStatusCode.NotFound, "No expression data for this dataset")
                    } else {
                        val expressionDataset = H5ExpressionDataset.getDataset(filePath)
                        val genes: List<Int> = body.genes
                        call.respond(expressionDataset.getFeaturesAverage(genes))
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
