job("run shell script") {
    container("ubuntu") {
        shellScript {
            interpreter = "/bin/bash"
            content = """
                echo Hello
                echo World!
            """.trimIndent()
        }
    }
}