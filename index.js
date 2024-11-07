// index.js
const http = require('http');
const express = require('express');
const { Server: SocketIO } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;

const users = new Map();

io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);
    users.set(socket.id, socket.id);

    socket.broadcast.emit('users:joined', socket.id);
    socket.emit('hello', { id: socket.id });

    // Handle outgoing call
    socket.on('outgoing:call', ({ fromOffer, to }) => {
        socket.to(to).emit('incomming:call', { from: socket.id, offer: fromOffer });
    });

    // Handle call accepted
    socket.on('call:accepted', ({ answer, to }) => {
        socket.to(to).emit('incomming:answer', { from: socket.id, offer: answer });
    });

    // Handle ICE candidate exchange
    socket.on('ice-candidate', ({ candidate, to }) => {
        socket.to(to).emit('ice-candidate', { candidate });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        users.delete(socket.id);
        socket.broadcast.emit('user:disconnect', socket.id);
    });
});

app.use(express.static(path.resolve('./public')));

app.get('/users', (req, res) => {
    return res.json(Array.from(users));
});

server.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
