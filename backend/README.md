# BlockWise API

Service skeleton for BlockWise. The block-planning engine currently runs client-side in
the SPA ([`../src/lib/planningEngine.js`](../src/lib/planningEngine.js)); this service is
the integration point for the real AI / optimisation service and keeps the two-tier
deployment (Vercel frontend + Render backend) in place from day one.

## Run locally

```bash
cd backend
npm install
npm start          # or: npm run dev  (auto-restart on change)
```

Then:

```bash
curl http://localhost:4000/health          # {"status":"ok",...}
curl -X POST http://localhost:4000/api/plan # 501 stub
```

## Endpoints

| Method | Path           | Purpose                                                    |
|--------|----------------|-----------------------------------------------------------|
| GET    | `/`            | Liveness + service info                                    |
| GET    | `/health`      | Health check (used by Render / uptime pings)               |
| GET    | `/api/version` | `{ service, version }`                                     |
| POST   | `/api/plan`    | **Stub (501)** — where the real optimiser will plug in     |

## Environment variables

| Variable          | Default  | Notes                                                      |
|-------------------|----------|-----------------------------------------------------------|
| `PORT`            | `4000`   | Render injects this automatically                          |
| `FRONTEND_ORIGIN` | `*`      | Set to the deployed Vercel URL to lock down CORS           |

## Deploy (Render)

Web Service · Root Directory `backend` · Build `npm install` · Start `npm start` · Free
instance. See the "Deployment" section in the repo root [`README.md`](../README.md).
