import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar



plugins {
    java
    val kotlinVersion by System.getProperties()
    kotlin("jvm") version kotlinVersion.toString()
    kotlin("plugin.serialization") version kotlinVersion.toString()
    id("com.github.johnrengelman.shadow") version "5.2.0"
}

group = "ru.itmo.scn.fs"
version = "0.0.1"

repositories {
    mavenCentral()
    jcenter()
    mavenLocal()
    flatDir {
        dirs("libs")
    }
    maven(url = "https://kotlin.bintray.com/kotlinx/")
}

dependencies {
    val mongoVersion: String by System.getProperties()
    val ktorVersion: String by System.getProperties()
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.2")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime-jvm:0.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.1.0")
    implementation("io.github.jupf.staticlog:staticlog:2.2.0")
    implementation("org.litote.kmongo:kmongo:$mongoVersion")
    implementation(":jarhdf5-2.11.0")
    implementation("org.slf4j:slf4j-log4j12:1.7.21")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("junit", "junit", "4.12")
    testImplementation(kotlin("script-runtime"))
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-jackson:$ktorVersion")
    implementation("io.ktor:ktor-server-host-common:$ktorVersion")
    implementation("io.ktor:ktor-jackson:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-client-apache:$ktorVersion")
    implementation("io.ktor:ktor-gson:$ktorVersion")
}

sourceSets {
    main {
        java.srcDirs("src/main/kotlin")
        resources.srcDirs("resources/")
    }
    test {
        java.srcDirs("src/test/kotlin")
    }
}

tasks {
    named<ShadowJar>("shadowJar") {
        manifest {
            attributes(mapOf("Main-Class" to "ru.itmo.scn.fs.MainKt"))
        }
    }
}

tasks {
    build {
        dependsOn(shadowJar)
    }
}

tasks.test {
    systemProperty("java.library.path", "./libs")
}