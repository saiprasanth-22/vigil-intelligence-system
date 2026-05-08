import random
import time

import requests


API_URL = "http://localhost:8000/api/live/ingest"
TOKEN = "dev-demo-token"


def main() -> None:
    while True:
        value = random.uniform(70, 120)
        if int(time.time()) % 45 < 4:
            value = random.uniform(180, 210)

        response = requests.post(
            API_URL,
            headers={"Authorization": f"Bearer {TOKEN}"},
            json={
                "metric": "vibration_hz",
                "value": round(value, 2),
                "source": "machine_sensor_A",
            },
            timeout=10,
        )
        print(response.status_code, response.json())
        time.sleep(2)


if __name__ == "__main__":
    main()
