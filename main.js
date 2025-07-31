const net = require("net");
const http = require("http");
const websocketStream = require("websocket-stream");

const broker = require("./broker").createBroker({
  jwtSecret: process.env.JWT_SECRET,
  debug: process.env.DEBUG === "true",
  pubTopicCheck: process.env.PUB_TOPIC_CHECK === "true",
  subTopicCheck: process.env.SUB_TOPIC_CHECK === "true",
});

// TCP Server (MQTT)
const tcpServer = net.createServer(broker.handle);
const tcpPort = 1883;
tcpServer.listen(tcpPort, () => {
  console.log(`🟩 MQTT (TCP) listening on ${tcpPort}`);
});

// HTTP Server for WebSocket upgrade
const httpServer = http.createServer();
const wsPort = 8883; // Railway provides PORT

// WebSocket MQTT endpoint
websocketStream.createServer({ server: httpServer }, (stream) => {
  // Attach MQTT broker to the stream
  stream.remoteAddress = stream.socket._socket.remoteAddress; // Set client IP
  broker.handle(stream);
});

httpServer.listen(wsPort, () => {
  console.log(`🟦 MQTT (WS) listening on ${wsPort}`);
});
