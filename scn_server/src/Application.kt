package ru.itmo.scn.server

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.module.kotlin.readValue
import com.mongodb.client.MongoDatabase
import de.jupf.staticlog.Log
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
import kotlinx.css.CssBuilder
import kotlinx.html.CommonAttributeGroupFacade
import kotlinx.html.FlowOrMetaDataContent
import kotlinx.html.style
import org.litote.kmongo.*
import org.litote.kmongo.MongoOperator.*
import org.slf4j.event.Level
import ru.itmo.scn.fs.H5ExpressionDataset
import ru.itmo.scn.fs.SCDataset
import ru.itmo.scn.fs.SCDatasetExpression
import ru.itmo.scn.fs.SCMarkerEntry
import java.io.File
import java.text.DateFormat
import java.util.*


val mongoDBHost: String =  System.getenv("MONGODB_HOST") ?: "mongodb://mongo:27017"
val mongoDB: String = System.getenv("MONGODB_DATABASE") ?: "scn"
val mongoDBCollection: String = System.getenv("MONGODB_COLLECTION") ?: "datasets"
val mongoDBCollectionExpressionName: String = System.getenv("MONGODB_COLLECTION_exp") ?: "datasets_expression_data"
val mongoDBCollectionMarkersName: String = System.getenv("MONGODB_COLLECTION_markers") ?: "markers"
val pathToProd: String = System.getenv("PROD_PATH") ?: "/scn/scn_js/prod"

val client = KMongo.createClient(mongoDBHost)
val database: MongoDatabase = client.getDatabase(mongoDB)
val pathways: Map<String, List<String>> = ObjectMapper().readValue(object {}.javaClass.getResource("/pathways.json"))

fun main(args: Array<String>) {
    while (!database.listCollectionNames().contains(mongoDBCollection) ||
        !database.listCollectionNames().contains(mongoDBCollectionExpressionName) ||
        !database.listCollectionNames().contains(mongoDBCollectionMarkersName)) {
        Log.info("Some of MongoDB Collections do not exist yet, waiting")
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

suspend fun getGeneSetExpression(call: ApplicationCall, dataset: SCDataset, genes: List<String>) {
    val collectionExpression = database.getCollection<SCDatasetExpression>(mongoDBCollectionExpressionName)
    val scExpressionDataset = collectionExpression.findOne { SCDatasetExpression::token eq dataset.token }
    val filePath = dataset.expH5Table
    val featureCounts = scExpressionDataset?.featureCounts
    val features = scExpressionDataset?.features

    if ((filePath === null) ||
        (scExpressionDataset === null) ||
        (featureCounts === null) ||
        (features === null)
    ) {
        call.respond(HttpStatusCode.NotFound, "No expression data for this dataset")
    } else {
        val expressionDataset = H5ExpressionDataset.getDataset(filePath)
        val allGenes = features.map { it.lowercase(Locale.getDefault()) }
        val expressedGenes = featureCounts.mapKeys { it.key.lowercase(Locale.getDefault()) }
        val genesFromInput = genes.map { it.lowercase(Locale.getDefault()) }

        val genesFound = genesFromInput
            .map { Pair(it, allGenes.indexOf(it))  }
            .filter { it.second >= 0 }
            .filter { expressedGenes[it.first]!! > 0 }

        call.respond(mapOf(
            "allGenes" to genesFromInput,
            "expressedGenes" to genesFound.map { it.first },
            "averageExpression" to expressionDataset.getFeaturesAverage(genesFound.map { it.second })
        ))

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
                val pathwayGenes = pathways[pathway]

                if (dataset !== null) {
                    if (pathwayGenes === null) {
                        call.respond(HttpStatusCode.NotFound, "Pathway not found")
                    } else {
                        getGeneSetExpression(call, dataset, pathwayGenes)
                    }
                }


            }

            post("getGeneset") {
                val body = call.receive<BulkGeneSearchBody>();
                val dataset = checkToken(call, body.token)

                if (dataset !== null) {
                    val genes = body.bulkGeneSet.trim().split(Regex("\\s+"))
                    getGeneSetExpression(call, dataset, genes)
                }
            }

            post("getSingleGeneByDataset") {
                val body = call.receive<SingleGeneSearchBody>();
                val gene = body.gene

                val collection = database.getCollection<SCDataset>(mongoDBCollection)
                val collectionExpression = database.getCollection<SCDatasetExpression>(mongoDBCollectionExpressionName)
                val fieldString = "featureCounts.${gene}"

                val queryBson = """[
  { $match: { "$fieldString": {$gt: 0} } },
  { $lookup: { from: "$mongoDBCollection", localField: "token", foreignField: "token", as: "details"} },
  { $ addFields: { details: {$ first: "$ details"} } }, 
  { $project: {
      token: 1,
      count: "$ $fieldString",
      percent: { $divide: ["$ $fieldString", {$size: "$ barcodes"} ] },
      name: "$ details.name",
      description: "$ details.description",
      link: "$ details.link"
  } },
  { $sort: { percent: -1 } }
]
""".formatJson()

                val datasets = collectionExpression.aggregate<SingleGeneResponseDataset>(queryBson)
                call.respond(datasets.toMutableList())

            }

            post("getSingleGeneByCluster") {
                val body = call.receive<SingleGeneSearchBody>();
                val gene = body.gene
                val collectionMarkers = database.getCollection<SCMarkerEntry>(mongoDBCollectionMarkersName)


                // For some reason, in the mongodb field is kept as pvalueAdjusted and not
                // pValueAdjusted as intended.
                // Why? No idea

                val queryBson = """[
  { $match: { "gene": {$eq: "$gene"}, "pvalueAdjusted": {$lte: 0.01} } }, 
  { $lookup: { from: "$mongoDBCollection", localField: "token", foreignField: "token", as: "details"} },
  { $ addFields: { details: {$ first: "$ details"} } }, 
  { $ addFields: { name: "$ details.name", description: "$ details.description", link: "$ details.link"} },
  { $sort: { token: 1, pvalueAdjusted: 1 } },
  { $group: {
      _id: "$ token",
      token: {$first: "$ token"},
      tableName: {$first: "$ tableName"},
      pValue: {$first: "$ pvalue"},
      pValueAdjusted: {$first: "$ pvalueAdjusted"},
      averageLogFoldChange: {$first: "$ averageLogFoldChange"},
      pct1: {$first: "$ pct1"},
      pct2: {$first: "$ pct2"},
      cluster: {$first: "$ cluster"},
      gene: {$first: "$ gene"},
      name: {$first: "$ name"},
      description: {$first: "$ description"},
      link: {$first: "$ link"}
  } },
  { $ addFields: { diff: { $subtract: [ "$ pct1", "$ pct2" ] } } }, 
  { $sort: { diff: -1 } }
]

""".formatJson()

                val markers = collectionMarkers.aggregate<SingleGeneResponseCluster>(queryBson)
                call.respond(markers.toMutableList())
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

fun FlowOrMetaDataContent.styleCss(builder: CssBuilder.() -> Unit) {
    style(type = ContentType.Text.CSS.toString()) {
        +CssBuilder().apply(builder).toString()
    }
}

fun CommonAttributeGroupFacade.style(builder: CssBuilder.() -> Unit) {
    this.style = CssBuilder().apply(builder).toString().trim()
}

suspend inline fun ApplicationCall.respondCss(builder: CssBuilder.() -> Unit) {
    this.respondText(CssBuilder().apply(builder).toString(), ContentType.Text.CSS)
}
