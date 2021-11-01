import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar

plugins {
    java
    val kotlinVersion by System.getProperties()
    kotlin("jvm") version kotlinVersion.toString()
    kotlin("plugin.serialization") version kotlinVersion.toString()
    id("com.github.johnrengelman.shadow") version "5.2.0"
}

group = "ru.itmo.scn.server"


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
    val kotlinVersion: String by System.getProperties()
    val ktorVersion: String by System.getProperties()
    val logbackVersion: String by System.getProperties()
    val mongoVersion: String by System.getProperties()
    implementation(kotlin("stdlib"))

    implementation(project(":scn_fs"))
    implementation(":jarhdf5-2.11.0")
    implementation("org.litote.kmongo:kmongo:$mongoVersion")
    implementation("org.jetbrains.kotlin:kotlin-reflect:$kotlinVersion")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlinVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-runtime:0.14.0") // JVM dependency
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("ch.qos.logback:logback-classic:$logbackVersion")
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-html-builder:$ktorVersion")
    implementation("io.github.jupf.staticlog:staticlog:2.2.0")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-css-jvm:1.0.0-pre.258-kotlin-1.5.31")
    implementation("io.ktor:ktor-server-host-common:$ktorVersion")
    implementation("io.ktor:ktor-jackson:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-client-apache:$ktorVersion")
    implementation("io.ktor:ktor-gson:$ktorVersion")
    testImplementation("io.ktor:ktor-server-tests:$ktorVersion")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}

sourceSets {
    main {
        java.srcDirs("src/")
        resources.srcDirs("resources/")
    }
    test {
        java.srcDirs("test/")
    }
}

tasks {
    val mainClassName = "io.ktor.server.netty.EngineMain"
    named<ShadowJar>("shadowJar") {
        manifest {
            attributes(mapOf("Main-Class" to mainClassName))
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