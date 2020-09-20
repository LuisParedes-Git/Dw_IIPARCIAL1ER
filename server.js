//Configuraciones del servidor para llamar al archivo de la carpeta static

const express = require('express');
const app = express();
const socketio = require('socket.io');

app.use(express.static('static'));

const PORT = process.env.PORT || 3000;
const expressServer = app.listen(PORT, console.log(`Listening on port: ${PORT}`));
const io = socketio(expressServer);

module.exports = {
    app,
    io
};

