import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar

plugins {
    java
    kotlin("jvm") version "1.4.30"
    kotlin("plugin.serialization") version "1.4.30"
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
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.4.2")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime-jvm:0.1.0")
    compile("org.jetbrains.kotlinx:kotlinx-serialization-json:1.1.0")
    compile("io.github.jupf.staticlog:staticlog:2.2.0")
    compile("org.litote.kmongo:kmongo:3.11.1")
    compile(":jarhdf5-2.11.0")
    implementation("org.slf4j:slf4j-log4j12:1.7.21")
    compile("org.jetbrains.kotlin:kotlin-reflect:1.4.30")
    testCompile("org.jetbrains.kotlin:kotlin-test:1.4.30")
    testCompile("junit", "junit", "4.12")
}


sourceSets {
    main {
        java.srcDirs("src/main/kotlin")
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