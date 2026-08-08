# Cloudflare Email Multi-Forward Worker

This worker receives email from Cloudflare Email Routing and forwards one inbound
message to multiple destination email addresses.

## 1) Configure destination addresses

Edit `wrangler.toml`:

```toml
[vars]
FORWARD_TO = "team1@example.com,team2@example.com,team3@example.com"
```

## 2) Install and deploy

```bash
cd cloudflare-email-worker
npm install
npx wrangler login
npx wrangler deploy
```

## 3) Connect Email Routing action to worker

In Cloudflare dashboard:

1. Go to your domain -> **Email** -> **Email Routing**.
2. Create (or edit) route for inbound address/pattern.
3. In route action, choose **Send to a Worker**.
4. Select deployed worker: `email-multi-forwarder`.
5. Save route.

## 4) Verify

Send test email to routed address. Worker forwards same message to every address in
`FORWARD_TO`.

## Notes

- Worker rejects email if `FORWARD_TO` is empty or contains invalid email format.
- Duplicate recipient entries are automatically deduplicated.
