import paho.mqtt.client as mqtt
import json
import time
import ssl
from random import randrange, choice

LOCAL = False

HOST = "localhost" if LOCAL else "mqtt-jwt.up.railway.app"
PORT = 443
USER = "admin"
PASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdWJsaXNoIjpbImRyaXZlci9jb29yZGluYXRlcy8jIl0sInN1YnNjcmliZSI6W10sImNsaWVudElkIjoicHVibGlzaGVyIn0.CUtWTlyIndXpjavo6_mGforEQ43hOP5AxrVZm2Wv28Y"
TOPIC = "driver/coordinates/admin"

client = mqtt.Client(client_id="publisher", transport="websockets")
client.ws_set_options(path="/", headers=None)
client.tls_set(cert_reqs=ssl.CERT_NONE, tls_version=ssl.PROTOCOL_TLSv1_2)

client.username_pw_set(USER, PASSWORD)

try:
    client.connect(HOST, PORT)
    client.loop_start()  # Necessário para WebSockets

    for i in range(15):
        message_content = json.dumps(
            {
                "driver": choice(["John Doe", "Fred Smith", "Alfredo Santos"]),
                "coordinates": [
                    randrange(0, 100),
                    randrange(0, 100),
                    randrange(0, 100),
                ],
            }
        )
        message = client.publish(TOPIC, f"{i}: {message_content}", qos=0)
        print("✅ Message Published!" if message.rc == 0 else "❌ Error")
        time.sleep(choice([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]))
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    client.disconnect()
