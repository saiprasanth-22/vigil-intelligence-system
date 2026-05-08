import re


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    if chunk_size <= overlap:
        raise ValueError("chunk_size must be larger than overlap")

    chunks: list[str] = []
    start = 0

    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        chunk = cleaned[start:end]

        if end < len(cleaned):
            boundary = max(chunk.rfind(". "), chunk.rfind("\n"), chunk.rfind(" "))
            if boundary > chunk_size // 2:
                end = start + boundary + 1
                chunk = cleaned[start:end]

        chunks.append(chunk.strip())
        if end >= len(cleaned):
            break
        start = max(0, end - overlap)

    return [chunk for chunk in chunks if chunk]
