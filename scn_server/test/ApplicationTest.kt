package ru.itmo.scn.server

import io.ktor.application.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals


class ApplicationTest {
    @Test
    fun testRoot() {
        withTestApplication(Application::module) {
            handleRequest(HttpMethod.Get, "/scn/getPathwayNames").apply {
                assertEquals(HttpStatusCode.OK, response.status())
            }
        }
    }
}
