from pathlib import Path
from uuid import uuid4

from db.local_store import LocalStore


def test_local_store_insert_get_update_delete():
    path = Path(".test_data") / f"{uuid4()}.json"
    store = LocalStore(str(path))

    created = store.insert("files", {"user_id": "u1", "name": "demo.txt"})
    assert created["id"]

    found = store.get("files", created["id"], user_id="u1")
    assert found["name"] == "demo.txt"

    updated = store.update("files", created["id"], {"status": "ready"}, user_id="u1")
    assert updated["status"] == "ready"

    assert store.delete("files", created["id"], user_id="u1") is True
    assert store.get("files", created["id"], user_id="u1") is None
