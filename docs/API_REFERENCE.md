# API Reference

Protected routes require a bearer token header:

```http
Authorization: Bearer local-dev-token
```

Development auth logic:
- `DEV_AUTH_TOKEN=local-dev-token` works when `ENVIRONMENT` is `development`, `dev`, `local`, or `test`.
- `DEMO_AUTH_TOKEN=dev-demo-token` also works for demo access.
- Supabase JWT bearer tokens are still accepted when Supabase env vars are set.

Invalid examples:
- `Bearer local-dev-token`
- `Authorization: local-dev-token`
- `Authorization: Bearer <empty>`

## Public

- `GET /health`

## Auth

- `GET /api/auth/me`

## Files

- `POST /api/files/upload`
  - multipart field: `upload`
- `GET /api/files`
- `GET /api/files/{file_id}/status`
- `DELETE /api/files/{file_id}`

## Chat

- `POST /api/chat/query`

```json
{
  "message": "Has this vibration issue happened before?",
  "mode": "unified"
}
```

Modes: `library`, `live`, `unified`.

## Live

- `POST /api/live/ingest`

```json
{
  "metric": "vibration_hz",
  "value": 195,
  "source": "machine_sensor_A"
}
```

- `GET /api/live/events`
- `WS /ws/live/demo-user`

## Admin Data

- `GET /api/admin/overview`
- `GET /api/admin/logs`
- `GET /api/admin/errors`
- `GET /api/admin/rag-traces`
- `POST /api/admin/trigger-anomaly`
- `POST /api/admin/clear-demo-data`

## Visualizer Data

- `GET /api/visualizer/document-graph`
- `GET /api/visualizer/live-particles`
