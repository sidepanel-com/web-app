Good — now we’re talking architecture, not just OAuth.

You need **three capabilities per product surface**:

1. Realtime updates
2. Manual backfill/search
3. Create/update on user’s behalf

All of this still lives under **one OAuth client**.

---

# Gmail

## 1️⃣ Realtime Sync (Push)

Use:
**Gmail Push Notifications (watch API)**

You must:

- Create Pub/Sub topic
- Grant Gmail service account publish rights
- Call `users.watch`
- Renew every ~7 days

Enable:

```bash
gcloud services enable pubsub.googleapis.com
```

Create topic:

```bash
gcloud pubsub topics create gmail-push
```

Grant Gmail publish permission:

```bash
gcloud pubsub topics add-iam-policy-binding gmail-push \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

Then in your app:

- Call `users.watch`
- Store `historyId`
- On webhook hit → call `users.history.list`

---

## 2️⃣ Manual Sync / Search

Use:

- `users.messages.list`
- `users.messages.get`
- `q` parameter for Gmail-style search

Scopes needed:

```
gmail.modify
```

You do NOT need full mail scope.

---

## 3️⃣ Send Email

Use:

- `users.messages.send`

Scope:

```
gmail.send
```

---

# Google Calendar

## 1️⃣ Realtime Sync

Use:

**Calendar Push Notifications (Channels API)**

- Call `events.watch`
- Provide webhook endpoint
- Store channel ID
- Renew before expiration

No Pub/Sub required — direct webhook.

Scope needed:

```
calendar.events
```

(or full `calendar`)

---

## 2️⃣ Manual Sync / Search

Use:

- `events.list`
- `syncToken` for delta sync
- `timeMin` / `timeMax`

Scopes:

```
calendar.readonly
```

or

```
calendar.events
```

---

## 3️⃣ Create Events

Use:

- `events.insert`
- `events.update`
- `events.delete`

Scope:

```
calendar.events
```

---

# Recommended Scope Strategy For You

When user clicks:

### Connect Gmail

Request:

```
gmail.modify
gmail.send
```

### Connect Calendar

Request:

```
calendar.events
```

That covers:

- Realtime
- Manual sync
- Create/update

You do NOT need both readonly + write if you're already asking for write.

---

# Important Architecture For SidePanel

Because you're building:

- Multi-workspace
- Multi-Google-account
- Slack-style switching

You must store per Google account:

- access_token
- refresh_token
- expiry
- granted_scopes
- gmail_history_id
- calendar_sync_token
- watch_expiration
- channel_id

Treat Gmail and Calendar as integration records.

---

# Final CLI Additions

You need Pub/Sub:

```bash
gcloud services enable pubsub.googleapis.com
```

That’s the only extra infra beyond Gmail + Calendar APIs.

---

# Big Picture

You do NOT need:

- Separate OAuth apps
- Separate GCP projects
- Separate token systems

You need:

One OAuth client  
One GCP project  
Incremental scopes  
Proper token + watch tracking

---

If you want, I can sketch the exact table schema you should use in Supabase so you don’t regret this when you hit 10k connected accounts.
