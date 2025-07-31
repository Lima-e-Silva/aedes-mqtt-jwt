const aedes = require("aedes");
const utils = require("./utils");
const jwt = require("jsonwebtoken");

function createBroker(options = {}) {
  const broker = aedes();
  const {
    jwtSecret,
    debug = false,
    pubTopicCheck = true,
    subTopicCheck = true,
  } = options;

  const ERROR_DEBUG_MESSAGE = { ECONNRESET: "Client disconnected abruptly" };

  const IGNORE_CLIENT_ERROR = ["ECONNRESET"];
  const IGNORE_CONNECTION_ERROR = ["ECONNRESET"];

  // ─── Authentication ────────────────────────────────────────────────────────────
  broker.authenticate = function (client, username, password, callback) {
    try {
      const token = password.toString();
      const decoded = jwt.verify(token, jwtSecret);

      if (decoded.clientId && decoded.clientId !== client.id) {
        return callback(new Error("Client ID mismatch"), false);
      }

      // Store JWT token in client object
      client.jwt = decoded;
      callback(null, true);
    } catch (err) {
      console.error("Error authenticating client:", err.message);
      return callback(new Error(err.message), false);
    }
    debug ? console.log(`Client ${client.id} authenticated!`) : null;
  };

  // ─── Connection ────────────────────────────────────────────────────────────────
  broker.on("client", function (client) {
    console.log(`Client connected: ${client.id}`);
  });

  broker.on("clientDisconnect", function (client) {
    console.log(`Client disconnected: ${client.id}`);
  });

  // ─── Publish Authorization ────────────────────────────────────────────────────
  broker.authorizePublish = function (client, packet, callback) {
    if (pubTopicCheck) {
      // Client without JWT token
      if (!client.jwt || !client.jwt.publish) {
        return callback(new Error("Missing authorization token"));
      }

      // Invalid permission format
      if (!Array.isArray(client.jwt.publish)) {
        return callback(new Error("Invalid permission format"));
      }

      // Check if topic is in permissions list
      const hasPermission = client.jwt.publish.some((pattern) => {
        // Ignore invalid patterns
        if (typeof pattern !== "string") return false;
        return utils.matchTopic(pattern, packet.topic);
      });

      if (hasPermission) {
        callback(null); // Authorized
      } else {
        callback(new Error("Unauthorized topic")); // Not authorized
      }
    } else {
      callback(null);
    }
  };

  broker.on("publish", function (packet, client) {
    if (client && debug) {
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
  });

  // ─── Subscribe Authorization ───────────────────────────────────────────────────
  broker.authorizeSubscribe = function (client, sub, callback) {
    if (subTopicCheck) {
      // Client without JWT token - not authorized
      if (!client.jwt || !client.jwt.subscribe) {
        return callback(new Error("Missing authorization token"));
      }

      // Invalid permission format
      if (!Array.isArray(client.jwt.subscribe)) {
        return callback(new Error("Invalid permission format"));
      }

      // Check if topic is in permissions list
      const hasPermission = client.jwt.subscribe.some((pattern) => {
        // Ignore invalid patterns
        if (typeof pattern !== "string") return false;
        return utils.matchTopic(pattern, sub.topic);
      });

      if (hasPermission) {
        callback(null, sub); // Authorized
      } else {
        callback(new Error("Unauthorized topic")); // Not authorized
      }
    } else {
      callback(null, sub);
    }
  };

  // ─── Error Handling ──────────────────────────────────────────────────────────
  broker.on("clientError", function (client, err) {
    if (debug) {
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

  broker.on("connectionError", function (client, err) {
    if (debug) {
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

  // Log configuration
  debug ? console.log("⚙ RUNNING IN DEBUG MODE") : null;
  !pubTopicCheck ? console.log("WARNING: PUB_TOPIC_CHECK DISABLED") : null;
  !subTopicCheck ? console.log("WARNING: SUB_TOPIC_CHECK DISABLED") : null;

  return broker;
}

module.exports = { createBroker };
