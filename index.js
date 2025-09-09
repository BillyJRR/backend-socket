const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

const { v4: uuidv4 } = require("uuid");

const instanceId = uuidv4();
console.log("Iniciando instancia con ID:", instanceId);

app.use(bodyParser.json());

// CONFIG desde variables de entorno
const REDIS_HOST_SOCKET = process.env.REDIS_HOST_SOCKET;
const REDIS_PORT_SOCKET = process.env.REDIS_PORT_SOCKET;
const REDIS_KEY_SOCKET  = process.env.REDIS_KEY_SOCKET;

// Conectar Redis con TLS (rediss)
async function setupRedisAdapter() {
  const pubClient = createClient({
    url: `rediss://${REDIS_HOST_SOCKET}:${REDIS_PORT_SOCKET}`,
    password: REDIS_KEY_SOCKET
  });
  pubClient.on("error", (err) => console.error("Redis pubClient error", err));
  await pubClient.connect();

  const subClient = pubClient.duplicate();
  subClient.on("error", (err) => console.error("Redis subClient error", err));
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));
}

setupRedisAdapter().catch(err => {
  console.error("Failed to setup Redis adapter", err);
  process.exit(1);
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);
});

app.post("/send-data", (req, res) => {
  const data = req.body;
  console.log(`[${instanceId}] Mensaje recibido:`, req.body);
  io.emit("formData", data);
  res.json({ status: "ok", sent: data });
});

server.listen(port, () => console.log(`Server listening ${port}`));