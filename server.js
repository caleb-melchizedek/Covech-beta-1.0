const path = require('path');
const { createServer } = require('http');

const express = require('express');
const { getIO, initIO } = require('./socket');

const app = express();
app.set('view engine', 'ejs');
app.use('/', express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
     res.render("index")
   })
const httpServer = createServer(app);

let port = process.env.PORT || 3500;

initIO(httpServer);

httpServer.listen(port)
console.log("Server started on ", port);

getIO();



// const express = require('express')
// const app = express()
// var debug = require('debug')

// const server = require('http').Server(app)
// const io = require('socket.io')(server)
// const { v4: uuidV4 } = require('uuid')

// const port = normalizePort(process.env.PORT || '3000');

// var http = require('http');

// app.set('view engine', 'ejs');
// app.set('port', port);
// app.use(express.static('public'))

// app.get('/', (req, res) => {
//   res.redirect(`/${uuidV4()}`)
// })

// app.get('/:room', (req, res) => {
//   res.render('room', { roomId: req.params.room })
// })

// io.on('connection', socket => {
//   socket.on('join-room', (roomId, userId) => {
//     socket.join(roomId)
//     socket.broadcast.to(roomId).emit('user-connected', userId)

//     socket.on('disconnect', () => {
//       socket.broadcast.to(roomId).emit('user-disconnected', userId)
//     })
//   })
// })



// server.listen(port)
// server.on('error', onError);
// server.on('listening', onListening);

