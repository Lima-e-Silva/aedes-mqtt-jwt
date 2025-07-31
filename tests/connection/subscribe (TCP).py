import paho.mqtt.client as mqtt

HOST = "switchback.proxy.rlwy.net"  # HOST variable in Railway
PORT = 30986                      # PORT variable in Railway

# HOST = "localhost"  # HOST variable in Railway
# PORT = 1883  # PORT variable in Railway

USER = "admin"  # USER variable in Railway
PASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdWJsaXNoIjpbXSwic3Vic2NyaWJlIjpbImRyaXZlci9jb29yZGluYXRlcy8jIl0sImNsaWVudElkIjoic3Vic2NyaWJlciJ9.8VORz6X5ZG1B4CgZZV112EOLwG2vH7rFzzJWrOfksD0"
TOPIC = "driver/coordinates/#"
CLIENT_ID = "subscriber"  # Client identifier (optional)


# On connection callback
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected")
        client.subscribe(
            TOPIC, qos=0
        )  # You can learn more about 'Quality of Service' here: https://cedalo.com/blog/understanding-mqtt-qos/
    else:
        print(f"❌ Error: {rc}")


# On message callback
def on_message(client, userdata, msg):
    print(f"\n📬 New Message [QoS={msg.qos}]:")
    print(f"Topic: {msg.topic}")
    print(f"Content: {msg.payload.decode()}")


# Configuração do cliente
client = mqtt.Client(client_id=CLIENT_ID)
client.username_pw_set(USER, PASSWORD)
client.on_connect = on_connect
client.on_message = on_message

try:
    print(f"🔗 Connecting to {HOST}:{PORT}...")
    client.connect(HOST, PORT, keepalive=60)
    client.loop_forever()  # Keep listening
except KeyboardInterrupt:
    print("\n🔗 Disconnecting...")
    client.disconnect()
except Exception as e:
    print(f"❌ Error: {e}")
