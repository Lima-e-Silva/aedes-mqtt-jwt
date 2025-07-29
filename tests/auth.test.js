const mqtt = require("mqtt");
const jwt = require("jsonwebtoken");
const net = require("net");
const broker = require("../broker");

const JWT_SECRET = "66f823612b994d990d148683016eafa4";
const PORT = 1884; // Different port than main app for testing

const VALID_TOKEN = jwt.sign(
  {
    clientId: "test-client",
    publish: ["test/topic"],
    subscribe: ["test/topic"],
  },
  JWT_SECRET
);

describe("MQTT Broker Authentication", () => {
  let testBroker;
  let server;

  beforeAll((done) => {
    // Create a new broker instance for testing
    testBroker = broker.createBroker({ jwtSecret: JWT_SECRET });
    server = net.createServer(testBroker.handle);

    // Start server
    server.listen(PORT, done);
  });

  afterAll((done) => {
    // Cleanup
    testBroker.close(() => {
      server.close(done);
    });
  });

  afterEach(() => {
    // Disconnect any remaining clients
    testBroker.clients = {};
  });

  test("should reject connection when no token is provided", (done) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "test-client",
      username: "test",
      password: "",
    });

    client.on("error", (error) => {
      expect(error.message).toContain("Not authorized");
      client.end(true, done);
    });
  });

  test("should reject connection with invalid token", (done) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "test-client",
      username: "test",
      password: "invalid-token",
    });

    client.on("error", (error) => {
      expect(error.message).toContain("Not authorized");
      client.end(true, done);
    });
  });

  test("should accept connection with valid token", (done) => {
    const token = jwt.sign(
      {
        clientId: "test-client",
        publish: ["test/topic"],
        subscribe: ["test/topic"],
      },
      JWT_SECRET
    );

    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "test-client",
      username: "test",
      password: token,
    });

    client.on("connect", () => {
      expect(client.connected).toBe(true);
      client.end(true, done);
    });

    client.on("error", (error) => {
      done(error);
    });
  });

  test("should reject connection when clientId does not match token", (done) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "invalid-client", // Different from token's clientId
      username: "test",
      password: VALID_TOKEN,
    });

    client.on("error", (error) => {
      console.log("here is the error message", error.message);
      expect(error.message).toContain("Not authorized");
      client.end(true, done);
    });
  });

  test("should reject publish to unauthorized topic", (done) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "test-client",
      username: "test",
      password: VALID_TOKEN,
    });

    client.on("connect", () => {
      // Try to publish to unauthorized topic
      client.publish("unauthorized/topic", "test message", (error) => {
        expect(error).not.toBeNull();
        client.end(true, done);
      });
    });

    client.on("error", (error) => {
      done(error);
    });
  });

  test("should accept publish to authorized topic", (done) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "test-client",
      username: "test",
      password: VALID_TOKEN,
    });

    client.on("connect", () => {
      // Try to publish to authorized topic
      client.publish("test/topic", "test message", (error) => {
        expect(error).toBeUndefined();
        client.end(true, done);
      });
    });

    client.on("error", (error) => {
      done(error);
    });
  });

  test("should reject subscribe to unauthorized topic", (done) => {
    const client = mqtt.connect(`mqtt://localhost:${PORT}`, {
      clientId: "test-client",
      username: "test",
      password: VALID_TOKEN,
    });

    client.on("connect", () => {
      // Try to publish to unauthorized topic
      client.subscribe("unauthorized/topic", (error) => {
        expect(error).not.toBeNull();
        client.end(true, done);
      });
    });

    client.on("error", (error) => {
      done(error);
    });
  });
});
