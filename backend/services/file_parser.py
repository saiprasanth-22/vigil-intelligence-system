import csv
from io import BytesIO, StringIO
from pathlib import Path


SUPPORTED_EXTENSIONS = {".txt", ".csv", ".pdf"}


def parse_file(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Use TXT, CSV, or PDF.")

    if not content:
        raise ValueError("File is empty.")

    if extension == ".txt":
        return content.decode("utf-8", errors="ignore").strip()

    if extension == ".csv":
        return _parse_csv(content)

    return _parse_pdf(content)


def _parse_csv(content: bytes) -> str:
    text = content.decode("utf-8", errors="ignore")
    reader = csv.reader(StringIO(text))
    rows = []

    for row in reader:
        cleaned = [cell.strip() for cell in row if cell.strip()]
        if cleaned:
            rows.append(" | ".join(cleaned))

    return "\n".join(rows).strip()


def _parse_pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("pypdf is required to parse PDFs.") from exc

    reader = PdfReader(BytesIO(content))
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(page.strip() for page in pages if page.strip()).strip()

    if not text:
        raise ValueError("No text found in PDF. Scanned PDFs are not supported.")

    return text
