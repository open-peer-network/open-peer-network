(() => {
    class myWebsocketHandler {
        setupSocket() {
            this.socket = new WebSocket("ws://localhost:4000/ws/chat")

            this.socket.addEventListener("message", (event) => {
                const pTag = document.createElement("p")
                pTag.innerHTML = event.data

                document.getElementById("main").append(pTag)
            })

            this.socket.addEventListener("close", () => {
                this.setupSocket()
            })
        }

        submit(event) {
            event.preventDefault()
            const triple = [
                document.getElementById("subject").value,
                document.getElementById("predicate").value,
                document.getElementById("object").value,
            ];

            this.socket.send(JSON.stringify({ data: { spo: triple } }))
        }
    }

    const websocketClass = new myWebsocketHandler()
    websocketClass.setupSocket()

    document.getElementById("button")
        .addEventListener("click", (event) => websocketClass.submit(event))
})()
