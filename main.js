const utils = require("./utils");

const aedes = require("aedes")();
const jwt = require("jsonwebtoken");
const net = require("net");

const tcpServer = net.createServer(aedes.handle);
const tcpPort = 1883;
tcpServer.listen(tcpPort, function () {
  console.log(`🟩 MQTT SERVER (TCP) LISTENING ON ${tcpPort}`);
});

DEBUG = process.env.DEBUG === "true";
PUB_TOPIC_CHECK = process.env.PUB_TOPIC_CHECK === "true";
SUB_TOPIC_CHECK = process.env.SUB_TOPIC_CHECK === "true";

ERROR_DEBUG_MESSAGE = { ECONNRESET: "Client disconnected abruptly" };

IGNORE_CLIENT_ERROR = ["ECONNRESET"];
IGNORE_CONNECTION_ERROR = ["ECONNRESET"];

// ─── Autenticação ────────────────────────────────────────────────────────────────────────────────────────────────────
aedes.authenticate = function (client, username, password, callback) {
  try {
    const token = password.toString();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.clientId && decoded.clientId !== client.id) {
      return callback(new Error("Client ID mismatch"), false);
    }

    // Armazenar o token JWT no objeto do cliente
    client.jwt = decoded;
    callback(null, true);
  } catch (err) {
    console.error("Error authenticating client:", err.message);
    callback(err, false);
  }
  DEBUG ? console.log(`Client ${client.id} authenticated!`) : null;
};

// ─── Conexão ─────────────────────────────────────────────────────────────────────────────────────────────────────────
aedes.on("client", function (client) {
  console.log(`Client connected: ${client.id}`);
});
aedes.on("clientDisconnect", function (client) {
  console.log(`Client disconnected: ${client.id}`);
});

// ─── Publicação ──────────────────────────────────────────────────────────────────────────────────────────────────────
aedes.authorizePublish = function (client, packet, callback) {
  if (PUB_TOPIC_CHECK) {
    // Cliente sem token JWT
    if (!client.jwt || !client.jwt.publish) {
      return callback(new Error("Missing authorization token"));
    }

    // Permissões não estão em formato válido
    if (!Array.isArray(client.jwt.publish)) {
      return callback(new Error("Invalid permission format"));
    }

    // Verificar se o tópico está na lista de permissões
    const hasPermission = client.jwt.publish.some((pattern) => {
      // Ignora padrões inválidos
      if (typeof pattern !== "string") return false;
      return utils.matchTopic(pattern, packet.topic);
    });

    if (hasPermission) {
      callback(null); // Autorizado
    } else {
      callback(new Error("Unauthorized topic")); // Não autorizado
    }
  } else {
    callback(null);
  }
};

aedes.on("publish", function (packet, client) {
  if (client) {
    if (DEBUG) {
      console.log(
        JSON.stringify(
          {
            client: client.id,
            topic: packet.topic,
            payload: packet.payload.toString(),
          },
          null,
          2
        )
      );
    }
  }
});

// ─── Inscrição ───────────────────────────────────────────────────────────────────────────────────────────────────────
aedes.authorizeSubscribe = function (client, sub, callback) {
  if (SUB_TOPIC_CHECK) {
    // Cliente sem token JWT - não autorizado
    if (!client.jwt || !client.jwt.subscribe) {
      return callback(new Error("Missing authorization token"));
    }

    // Permissões não estão em formato válido
    if (!Array.isArray(client.jwt.subscribe)) {
      return callback(new Error("Invalid permission format"));
    }

    // Verificar se o tópico está na lista de permissões
    const hasPermission = client.jwt.subscribe.some((pattern) => {
      // Ignora padrões inválidos
      if (typeof pattern !== "string") return false;
      return utils.matchTopic(pattern, sub.topic);
    });

    if (hasPermission) {
      callback(null, sub); // Autorizado
    } else {
      callback(new Error("Unauthorized topic")); // Não autorizado
    }
  } else {
    callback(null, sub);
  }
};

// ─── Erros ───────────────────────────────────────────────────────────────────────────────────────────────────────────
aedes.on("clientError", function (client, err) {
  if (DEBUG) {
    err.code in ERROR_DEBUG_MESSAGE
      ? console.log(ERROR_DEBUG_MESSAGE[err.code])
      : console.error(`New client error: ${err}`);
  }
  if (IGNORE_CLIENT_ERROR.includes(err.code)) {
    null;
  } else {
    console.error(`New client error | Client ${client.id} | ${err}`);
  }
});
aedes.on("connectionError", function (client, err) {
  if (DEBUG) {
    err.code in ERROR_DEBUG_MESSAGE
      ? console.log(ERROR_DEBUG_MESSAGE[err.code])
      : console.error(`New connection error: ${err}`);
  }
  if (IGNORE_CONNECTION_ERROR.includes(err.code)) {
    null;
  } else {
    console.error(`New connection error | Client ${client.id} | ${err}`);
  }
});
DEBUG ? console.log("⚙ RUNNING IN DEBUG MODE") : null;
!PUB_TOPIC_CHECK ? console.log("WARNING: PUB_TOPIC_CHECK DISABLED") : null;
!SUB_TOPIC_CHECK ? console.log("WARNING: SUB_TOPIC_CHECK DISABLED") : null;
