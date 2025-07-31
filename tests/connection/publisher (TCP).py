import paho.mqtt.client as mqtt
import json
import time
from random import randrange, choice

HOST = "switchback.proxy.rlwy.net"  # HOST variable in Railway
PORT = 30986  # PORT variable in Railway
# HOST = "localhost"  # HOST variable in Railway
# PORT = 1883  # PORT variable in Railway
USER = "admin"  # USER variable in Railway
PASSWORD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdWJsaXNoIjpbImRyaXZlci9jb29yZGluYXRlcy8jIl0sInN1YnNjcmliZSI6W10sImNsaWVudElkIjoicHVibGlzaGVyIn0.CUtWTlyIndXpjavo6_mGforEQ43hOP5AxrVZm2Wv28Y"
TOPIC = "driver/coordinates/admin"  # The topic you want to publish a message

client = mqtt.Client(client_id="publisher")
client.username_pw_set(USER, PASSWORD)

try:
    client.connect(HOST, PORT)
    # client.publish(
    #     TOPIC, MESSAGE, qos=0
    # )  # You can learn more about 'Quality of Service' here: https://cedalo.com/blog/understanding-mqtt-qos/
    # print("✅ Message Published!")
    for i in range(1_000):
        message_content = json.dumps(
            {
                "driver": choice(["John Doe", "Fred Smith", "Alfredo Santos"]),
                "coordinates": [randrange(0, 100), randrange(0, 100), randrange(0, 100)],
            }
        )
        message = client.publish(
            TOPIC, f"{i}: {message_content}", qos=0
        )  # You can learn more about 'Quality of Service' here: https://cedalo.com/blog/understanding-mqtt-qos/
        print("✅ Message Published!" if message.rc == 0 else "❌ Error")
        time.sleep(choice([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]))
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    client.disconnect()
