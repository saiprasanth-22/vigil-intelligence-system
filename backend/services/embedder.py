import hashlib
import math
import re


VECTOR_SIZE = 128


def embed_text(text: str) -> list[float]:
    vector = [0.0] * VECTOR_SIZE
    tokens = re.findall(r"[a-zA-Z0-9_]+", text.lower())

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % VECTOR_SIZE
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector

    return [value / norm for value in vector]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    return sum(left * right for left, right in zip(a, b))
