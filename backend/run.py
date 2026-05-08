from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent
VENDOR = ROOT / "vendor"

if VENDOR.exists():
    sys.path.insert(0, str(VENDOR))

import uvicorn


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
