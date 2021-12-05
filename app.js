import config from "config";
import express from "express";
import http from "http";
import {Server} from "socket.io";

const PORT = config.get('port') || 8084;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
  }
});

io.on('connection', socket => {

});

server.listen(PORT, () => console.log(`App has been started on port ${PORT}...`));
