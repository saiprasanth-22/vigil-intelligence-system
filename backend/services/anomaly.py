DEFAULT_THRESHOLDS = {
    "vibration_hz": 150.0,
    "vibration": 150.0,
    "temperature_c": 90.0,
    "temperature": 90.0,
    "pressure": 220.0,
}


def detect_anomaly(metric: str, value: float) -> tuple[bool, str | None]:
    threshold = DEFAULT_THRESHOLDS.get(metric)
    if threshold is None:
        return False, None

    if value > threshold:
        return True, f"{metric}={value} exceeded threshold {threshold}"

    return False, None
