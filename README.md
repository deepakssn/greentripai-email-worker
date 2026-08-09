# GreenTrip AI Email Worker

This Worker receives inbound email from Cloudflare Email Routing and forwards one
message to multiple recipients.

## Deploy automatically from Git (no manual `wrangler deploy`)

Use **Workers Builds** in Cloudflare so each push to `main` auto-deploys.

1. In Cloudflare dashboard, go to **Workers & Pages**.
2. Click **Create** -> **Import a repository**.
3. Connect GitHub and select this repo.
4. Project type: **Workers**.
5. Branch to deploy: `main`.
6. Build command: leave empty (Worker deploys from source).
7. Root directory: `/` (repo root).
8. Save and deploy.

After this, every push to `main` triggers Cloudflare build + deploy.

## Required runtime variable

Set this in Cloudflare dashboard (not in git):

- Key: `FORWARD_TO`
- Value example: `team1@example.com,team2@example.com,team3@example.com`

Where to set:
- **Workers & Pages** -> `greentripai-email-worker` -> **Settings** -> **Variables and Secrets** -> Add plain text variable.

## Connect Email Routing to this Worker

1. Go to domain -> **Email** -> **Email Routing**.
2. Create or edit inbound route.
3. Action: **Send to a Worker**.
4. Select Worker: `greentripai-email-worker`.
5. Save route.

## Local optional commands

```bash
npm install
npm run dev
```

Manual deploy command still available if needed:

```bash
npm run deploy
```

## Behavior

- Rejects email if `FORWARD_TO` missing/empty.
- Rejects email if any configured recipient is invalid.
- De-duplicates recipients automatically.
- Emits detailed logs with `requestId` for tracing failures.
