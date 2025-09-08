const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // habilitar CORS para pruebas
});

app.use(bodyParser.json());

// Almacena sockets conectados
let sockets = {};

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);
  sockets[socket.id] = socket;

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    delete sockets[socket.id];
  });
});

// Endpoint para recibir datos desde Postman y reenviar al front
app.post("/send-data", (req, res) => {
  const data = req.body;
  console.log("Datos recibidos:", data);

  // Emitir datos a todos los sockets conectados
  io.emit("formData", data);

  res.json({ status: "ok", sent: data });
});

server.listen(3000, () => {
  console.log("Backend corriendo en http://localhost:3000");
});
