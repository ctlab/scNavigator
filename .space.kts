job("Test gradlew server") {
    gradlew("gradle:jdk8", "build") {
        env["MONGODB_HOST"] = "127.0.0.1:27017"
        env["MONGODB_DATABASE"] = "scn"
        env["MONGODB_COLLECTION"] = "datasets"
        env["PROD_PATH"] = ""

        service("mongo:latest")
    }
}

job("Build frontend") {
    container("node:12-alpine") {
        workDir = "./scn_js"
        shellScript {
            content = "npm install && npm run build"
        }
    }
}

job("Build and test python converter") {
    container("python:3.8-alpine") {
        workDir = "./scn_h5_converter"
        shellScript {
            content = "pip install -r requirements.txt"
        }
        shellScript {
            content = "export PYTHONPATH=\$PYTHONPATH:`pwd` && pytest tests --typeguard-packages=converter"
        }
    }
}