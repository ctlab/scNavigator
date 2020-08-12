job("Test gradlew server") {
    gradlew("gradle:jdk8", "build") {
        env["MONGODB_HOST"]="127.0.0.1:27017"
        env["MONGODB_DATABASE"]="scn"
        env["MONGODB_COLLECTION"]="datasets"
        env["PROD_PATH"]=""

        service("mongo:latest")
    }
}

job("Build frontend") {
    container("node:12-alpine") {
        shellScript {
            content = "cd scn_js && npm install && npm run build"
        }
    }
}