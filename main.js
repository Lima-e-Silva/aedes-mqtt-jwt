const net = require("net");

const broker = require("./broker").createBroker(
  (options = {
    jwtSecret: process.env.JWT_SECRET,
    debug: process.env.DEBUG === "true",
    pubTopicCheck: process.env.PUB_TOPIC_CHECK === "true",
    subTopicCheck: process.env.SUB_TOPIC_CHECK === "true",
  })
);

const tcpServer = net.createServer(broker.handle);
const tcpPort = 1883;
tcpServer.listen(tcpPort, function () {
  console.log(`🟩 MQTT SERVER (TCP) LISTENING ON ${tcpPort}`);
});
