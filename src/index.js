import config from "config";
import express from "express";
import http from "http";
import crypto from "crypto";
import {Server} from "socket.io";

const PORT = config.get('port') || 8084;

const index = express();

const server = http.createServer(index);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
  }
});

io.use((socket, next) => {
  socket.clientID = crypto.randomUUID();
  socket.companionID = null;
  next();
});

const clients = new Map();
const queue = [];

const stopChat = (socket) => {
  const companionSocket = clients.get(socket.companionID);
  socket.companionID = null;

  if (companionSocket) {
    companionSocket.companionID = null;
  }

  companionSocket?.emit("chat_stop");
};

const deleteFromQueue = (id) => {
  const index = queue.findIndex((item) => item === id);
  if (index >= 0) {
    queue.splice(index, 1);
  }
};

io.on("connect", (socket) => {
  const {clientID} = socket;

  socket.join(clientID);

  clients.set(clientID, socket);

  socket.on("chat_search_start", () => {
    socket.companionID = queue.shift();

    if (!socket.companionID) {
      queue.push(clientID);
      return;
    }

    const companionSocket = clients.get(socket.companionID);
    companionSocket.companionID = clientID;
    socket.emit("chat_start");
    companionSocket.emit("chat_start");
  });

  socket.on("chat_search_stop", () => {
    deleteFromQueue(clientID);
  });

  socket.on("chat_message", ({message}) => {
    const companionSocket = clients.get(socket.companionID);
    companionSocket.emit("chat_message", {message});
  });

  socket.on("chat_stop", () => {
    stopChat(socket);
  });

  socket.on("disconnect", () => {
    stopChat(socket);
    deleteFromQueue(clientID);
    clients.delete(clientID);
  });
});

server.listen(PORT, () => console.log(`App has been started on port ${PORT}...`));
