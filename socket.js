const { Server } = require('socket.io');
let IO;

let usersOnline=[]

module.exports.initIO = (httpServer) => {
    IO = new Server(httpServer);

    IO.use((socket, next) => {
        if (socket.handshake.query) {
            let userName = socket.handshake.query.name
            socket.user = userName;
            next();
        }
    })

    IO.on('connection', (socket) => {
        console.log(socket.user, "Connected");
        usersOnline=[...usersOnline,socket.user]
        console.log(usersOnline);
        IO.emit('updateUsersOnline',{usersOnline})
        socket.join(socket.user);

        socket.on('call', (data) => {
            let callee = data.name;
            let rtcMessage = data.rtcMessage;

            socket.to(callee).emit("newCall", {
                caller: socket.user,
                rtcMessage: rtcMessage
            })

        })

        socket.on('answerCall', (data) => {
            let caller = data.caller;
            rtcMessage = data.rtcMessage

            socket.to(caller).emit("callAnswered", {
                callee: socket.user,
                rtcMessage: rtcMessage
            })

        })

        socket.on('localICEcandidate', (data) => {
            let otherUser = data.user;
            let rtcMessage = data.rtcMessage;
            console.log("local candidate sent.")

            socket.to(otherUser).emit("remoteICEcandidate", {
                sender: socket.user,
                rtcMessage: rtcMessage
            })
        })

        socket.on("disconnect",()=>{
            console.log(socket.user+" disconnected")
            usersOnline= usersOnline.filter(e=>e!==socket.user)
            console.log(usersOnline)
            IO.emit('updateUsersOnline',{usersOnline})
            IO.emit("userDisconected",{user:socket.user})

        })
    })
}

module.exports.getIO = () => {
    if (!IO) {
        throw Error("IO not initilized.")
    } else {
        return IO;
    }
}