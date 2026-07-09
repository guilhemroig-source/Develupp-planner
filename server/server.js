import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import crypto from "crypto";
import dotenv from "dotenv";
import webpush from "web-push";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3001;
const APP_PASSWORD = process.env.APP_PASSWORD || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const HIGGSFIELD_MCP_URL = "https://mcp.higgsfield.ai/mcp";
const ANTHROPIC_MODEL = "claude-sonnet-4-6"; // keep in sync with Anthropic's current models
const VAPID_CONTACT_EMAIL = process.env.VAPID_CONTACT_EMAIL || "contact@example.com";
const REMINDER_TIMEZONE = process.env.REMINDER_TIMEZONE || "Europe/Paris";
const REMINDER_HOUR = Number(process.env.REMINDER_HOUR || 9); // 24h local time in REMINDER_TIMEZONE

if (!ANTHROPIC_API_KEY) {
  console.warn("⚠️  ANTHROPIC_API_KEY absente — la génération Higgsfield échouera. Voir .env.example.");
}
if (!APP_PASSWORD) {
  console.warn("⚠️  APP_PASSWORD absente — l'app est accessible sans mot de passe.");
}

// ---------- Database ----------

const db = new Database(path.join(__dirname, "data.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  hash TEXT,
  title TEXT,
  pillar_id TEXT,
  stage TEXT,
  date TEXT,
  platform TEXT,
  notes TEXT,
  hg_prompt TEXT,
  hg_job_id TEXT,
  hg_status TEXT,
  hg_video_url TEXT,
  hg_error TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS oauth (
  provider TEXT PRIMARY KEY,
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  registration_endpoint TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT,
  auth TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS kv_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// Lightweight migration: add reminder_sent_date to items if it's missing
// (safe to run every boot — checks first).
const itemColumns = db.prepare("PRAGMA table_info(items)").all().map((c) => c.name);
if (!itemColumns.includes("reminder_sent_date")) {
  db.exec("ALTER TABLE items ADD COLUMN reminder_sent_date TEXT");
}

// ---------- VAPID keys (generated once, stored in DB — no manual setup needed) ----------

function ensureVapidKeys() {
  const pub = db.prepare("SELECT value FROM kv_settings WHERE key = 'vapid_public'").get();
  const priv = db.prepare("SELECT value FROM kv_settings WHERE key = 'vapid_private'").get();
  if (pub?.value && priv?.value) {
    return { publicKey: pub.value, privateKey: priv.value };
  }
  const keys = webpush.generateVAPIDKeys();
  const upsert = db.prepare(`
    INSERT INTO kv_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  upsert.run("vapid_public", keys.publicKey);
  upsert.run("vapid_private", keys.privateKey);
  return keys;
}

const VAPID_KEYS = ensureVapidKeys();
webpush.setVapidDetails(`mailto:${VAPID_CONTACT_EMAIL}`, VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);

function rowToItem(r) {
  return {
    id: r.id,
    hash: r.hash,
    title: r.title,
    pillarId: r.pillar_id,
    stage: r.stage,
    date: r.date,
    platform: r.platform,
    notes: r.notes,
    higgsfield: {
      prompt: r.hg_prompt || "",
      jobId: r.hg_job_id || null,
      status: r.hg_status || null,
      videoUrl: r.hg_video_url || null,
      error: r.hg_error || null,
    },
  };
}

// ---------- Auth (simple shared-password session) ----------

function requireAuth(req, res, next) {
  if (!APP_PASSWORD) return next();
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ error: "Non authentifié." });
  const row = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!row) return res.status(401).json({ error: "Session invalide." });
  next();
}

app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (!APP_PASSWORD) return res.json({ ok: true });
  if (password !== APP_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, created_at) VALUES (?, ?)").run(token, Date.now());
  res.cookie("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.json({ ok: true });
});

app.get("/api/session", requireAuth, (req, res) => res.json({ ok: true }));

app.post("/api/logout", (req, res) => {
  const token = req.cookies?.session;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.clearCookie("session");
  res.json({ ok: true });
});

// ---------- Content items CRUD ----------

app.get("/api/items", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM items ORDER BY created_at ASC").all();
  res.json(rows.map(rowToItem));
});

app.post("/api/items", requireAuth, (req, res) => {
  const it = req.body || {};
  if (!it.id) return res.status(400).json({ error: "id requis." });
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO items (id, hash, title, pillar_id, stage, date, platform, notes, hg_prompt, hg_job_id, hg_status, hg_video_url, hg_error, created_at, updated_at)
    VALUES (@id, @hash, @title, @pillarId, @stage, @date, @platform, @notes, @hgPrompt, @hgJobId, @hgStatus, @hgVideoUrl, @hgError, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      hash=excluded.hash, title=excluded.title, pillar_id=excluded.pillar_id, stage=excluded.stage,
      date=excluded.date, platform=excluded.platform, notes=excluded.notes,
      hg_prompt=excluded.hg_prompt, hg_job_id=excluded.hg_job_id, hg_status=excluded.hg_status,
      hg_video_url=excluded.hg_video_url, hg_error=excluded.hg_error, updated_at=excluded.updated_at
  `).run({
    id: it.id,
    hash: it.hash || "",
    title: it.title || "",
    pillarId: it.pillarId || "",
    stage: it.stage || "idea",
    date: it.date || null,
    platform: it.platform || "instagram",
    notes: it.notes || "",
    hgPrompt: it.higgsfield?.prompt || "",
    hgJobId: it.higgsfield?.jobId || null,
    hgStatus: it.higgsfield?.status || null,
    hgVideoUrl: it.higgsfield?.videoUrl || null,
    hgError: it.higgsfield?.error || null,
    createdAt: now,
    updatedAt: now,
  });
  res.json({ ok: true });
});

app.delete("/api/items/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- Higgsfield OAuth (MCP Authorization spec: discovery + dynamic client registration + PKCE) ----------

const PKCE_STORE = new Map(); // state -> { verifier, createdAt }

// Clean up stale PKCE entries every so often
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [state, v] of PKCE_STORE) {
    if (v.createdAt < cutoff) PKCE_STORE.delete(state);
  }
}, 5 * 60 * 1000);

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function discoverHiggsfieldAuthServer() {
  // Per the MCP Authorization spec, a protected resource may publish metadata
  // pointing to its authorization server. Fall back to the MCP server's own
  // origin if that isn't available.
  let authServerBase = null;
  try {
    const r = await fetch("https://mcp.higgsfield.ai/.well-known/oauth-protected-resource");
    if (r.ok) {
      const meta = await r.json();
      authServerBase = meta.authorization_servers?.[0] || null;
    }
  } catch (e) {
    // ignore — fall back below
  }
  if (!authServerBase) authServerBase = "https://mcp.higgsfield.ai";

  const asMetaUrl = `${authServerBase.replace(/\/$/, "")}/.well-known/oauth-authorization-server`;
  const asRes = await fetch(asMetaUrl);
  if (!asRes.ok) {
    throw new Error(
      `Découverte du serveur d'autorisation Higgsfield impossible (${asMetaUrl} → ${asRes.status}). ` +
        `Voir le plan B "connexion manuelle" dans le README.`
    );
  }
  return asRes.json();
}

async function ensureHiggsfieldClient() {
  let row = db.prepare("SELECT * FROM oauth WHERE provider = 'higgsfield'").get();
  if (row?.client_id && row?.authorization_endpoint && row?.token_endpoint) {
    return row;
  }

  const meta = await discoverHiggsfieldAuthServer();
  let clientId = row?.client_id || null;
  let clientSecret = row?.client_secret || null;

  if (!clientId && meta.registration_endpoint) {
    const regRes = await fetch(meta.registration_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Develupp Content Planner",
        redirect_uris: [`${PUBLIC_URL}/api/higgsfield/auth/callback`],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      }),
    });
    if (!regRes.ok) {
      const t = await regRes.text();
      throw new Error(`Enregistrement du client OAuth Higgsfield refusé (${regRes.status}): ${t.slice(0, 200)}`);
    }
    const reg = await regRes.json();
    clientId = reg.client_id;
    clientSecret = reg.client_secret || null;
  }

  if (!clientId) {
    throw new Error(
      "Pas d'enregistrement dynamique disponible côté Higgsfield. Utilise le plan B (connexion manuelle via MCP Inspector, voir README)."
    );
  }

  db.prepare(`
    INSERT INTO oauth (provider, client_id, client_secret, authorization_endpoint, token_endpoint, registration_endpoint)
    VALUES ('higgsfield', ?, ?, ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      client_id=excluded.client_id, client_secret=excluded.client_secret,
      authorization_endpoint=excluded.authorization_endpoint, token_endpoint=excluded.token_endpoint,
      registration_endpoint=excluded.registration_endpoint
  `).run(clientId, clientSecret, meta.authorization_endpoint, meta.token_endpoint, meta.registration_endpoint || null);

  return db.prepare("SELECT * FROM oauth WHERE provider = 'higgsfield'").get();
}

app.get("/api/higgsfield/auth/start", requireAuth, async (req, res) => {
  try {
    const client = await ensureHiggsfieldClient();
    const verifier = base64url(crypto.randomBytes(32));
    const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
    const state = base64url(crypto.randomBytes(16));
    PKCE_STORE.set(state, { verifier, createdAt: Date.now() });

    const redirectUri = `${PUBLIC_URL}/api/higgsfield/auth/callback`;
    const url = new URL(client.authorization_endpoint);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", client.client_id);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    res.redirect(url.toString());
  } catch (e) {
    res.status(500).send(
      `<p>Erreur de connexion Higgsfield : ${e.message}</p><p><a href="/">Retour à l'app</a></p>`
    );
  }
});

app.get("/api/higgsfield/auth/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`/?higgsfield_error=${encodeURIComponent(String(error))}`);

  const pending = PKCE_STORE.get(state);
  if (!pending) {
    return res.status(400).send(
      `<p>État OAuth invalide ou expiré. Relance la connexion depuis l'app.</p><p><a href="/">Retour à l'app</a></p>`
    );
  }
  PKCE_STORE.delete(state);

  try {
    const client = db.prepare("SELECT * FROM oauth WHERE provider = 'higgsfield'").get();
    const redirectUri = `${PUBLIC_URL}/api/higgsfield/auth/callback`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: redirectUri,
      client_id: client.client_id,
      code_verifier: pending.verifier,
    });
    if (client.client_secret) body.set("client_secret", client.client_secret);

    const tokenRes = await fetch(client.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      throw new Error(`Échange de token refusé (${tokenRes.status}): ${t.slice(0, 200)}`);
    }
    const tok = await tokenRes.json();
    const expiresAt = Date.now() + (tok.expires_in ? tok.expires_in * 1000 : 3600 * 1000);

    db.prepare(`
      UPDATE oauth SET access_token = ?, refresh_token = ?, expires_at = ? WHERE provider = 'higgsfield'
    `).run(tok.access_token, tok.refresh_token || null, expiresAt);

    res.redirect("/?higgsfield=connected");
  } catch (e) {
    res.redirect(`/?higgsfield_error=${encodeURIComponent(e.message)}`);
  }
});

// Manual fallback: paste a token obtained via `npx @modelcontextprotocol/inspector`
// (see README "Plan B") if the automated discovery/registration above doesn't
// match Higgsfield's exact implementation.
app.post("/api/higgsfield/auth/manual", requireAuth, (req, res) => {
  const { access_token, refresh_token, expires_in } = req.body || {};
  if (!access_token) return res.status(400).json({ error: "access_token requis." });
  const expiresAt = Date.now() + (expires_in ? Number(expires_in) * 1000 : 3600 * 1000);
  db.prepare(`
    INSERT INTO oauth (provider, access_token, refresh_token, expires_at)
    VALUES ('higgsfield', ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      access_token=excluded.access_token, refresh_token=excluded.refresh_token, expires_at=excluded.expires_at
  `).run(access_token, refresh_token || null, expiresAt);
  res.json({ ok: true });
});

app.get("/api/higgsfield/auth/status", requireAuth, (req, res) => {
  const row = db.prepare("SELECT access_token, expires_at FROM oauth WHERE provider = 'higgsfield'").get();
  res.json({ connected: !!row?.access_token });
});

async function getValidHiggsfieldToken() {
  const row = db.prepare("SELECT * FROM oauth WHERE provider = 'higgsfield'").get();
  if (!row || !row.access_token) {
    throw new Error("Higgsfield n'est pas connecté à cette app.");
  }
  const soonExpired = row.expires_at && row.expires_at < Date.now() + 30000;
  if (soonExpired && row.refresh_token && row.token_endpoint) {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
      client_id: row.client_id || "",
    });
    if (row.client_secret) body.set("client_secret", row.client_secret);
    const r = await fetch(row.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (r.ok) {
      const tok = await r.json();
      const expiresAt = Date.now() + (tok.expires_in ? tok.expires_in * 1000 : 3600 * 1000);
      db.prepare("UPDATE oauth SET access_token=?, refresh_token=?, expires_at=? WHERE provider='higgsfield'").run(
        tok.access_token,
        tok.refresh_token || row.refresh_token,
        expiresAt
      );
      return tok.access_token;
    }
  }
  return row.access_token;
}

// ---------- Anthropic API proxy (key stays server-side) ----------

async function callClaudeWithHiggsfield(userPrompt) {
  const token = await getValidHiggsfieldToken();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "mcp-client-2025-11-20",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: userPrompt }],
      mcp_servers: [
        {
          type: "url",
          url: HIGGSFIELD_MCP_URL,
          name: "higgsfield",
          authorization_token: token,
        },
      ],
      tools: [{ type: "mcp_toolset", mcp_server_name: "higgsfield" }],
    }),
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Erreur API Anthropic (${response.status}): ${t.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim()
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    const toolResults = (data.content || []).filter((b) => b.type === "mcp_tool_result");
    for (const block of toolResults) {
      const t = block?.content?.[0]?.text;
      if (!t) continue;
      try {
        const parsed = JSON.parse(t);
        if (parsed.id || parsed.job_id || parsed.status) {
          return {
            job_id: parsed.id || parsed.job_id,
            status: parsed.status,
            video_url: parsed.video_url || parsed.result_url || parsed.url || null,
          };
        }
      } catch (e2) {
        // not JSON, skip this block
      }
    }
    return { error: "Réponse inattendue : " + text.slice(0, 200) };
  }
}

app.post("/api/higgsfield/generate", requireAuth, async (req, res) => {
  const { itemId, prompt } = req.body || {};
  if (!itemId || !prompt) return res.status(400).json({ error: "itemId et prompt requis." });
  const now = new Date().toISOString();
  try {
    const instruction = `Tu as accès à l'outil Higgsfield generate_video via MCP. Lance une génération vidéo avec exactement ces paramètres : model="kling3_0_turbo", aspect_ratio="9:16", count=1, prompt="${prompt.replace(
      /"/g,
      "'"
    )}".

Si l'outil retourne une suggestion de preset au lieu de lancer la génération directement, décline-la et relance generate_video avec declined_preset_id égal à l'id du preset suggéré, en gardant model="kling3_0_turbo".

Ne pose aucune question et n'utilise aucun autre outil. Une fois qu'un job a été soumis, réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, sans balises markdown, au format exact : {"job_id": "<id>", "status": "<statut>"}. Si une erreur survient, réponds avec {"error": "<description courte>"}.`;

    const result = await callClaudeWithHiggsfield(instruction);
    if (result.error) {
      db.prepare("UPDATE items SET hg_error = ?, updated_at = ? WHERE id = ?").run(result.error, now, itemId);
      return res.json({ error: result.error });
    }
    db.prepare(`
      UPDATE items SET hg_prompt = ?, hg_job_id = ?, hg_status = ?, hg_video_url = NULL, hg_error = NULL, updated_at = ?
      WHERE id = ?
    `).run(prompt, result.job_id, result.status, now, itemId);
    res.json({ job_id: result.job_id, status: result.status });
  } catch (e) {
    db.prepare("UPDATE items SET hg_error = ?, updated_at = ? WHERE id = ?").run(e.message, now, itemId);
    res.status(200).json({ error: e.message });
  }
});

app.post("/api/higgsfield/status", requireAuth, async (req, res) => {
  const { itemId, jobId } = req.body || {};
  if (!itemId || !jobId) return res.status(400).json({ error: "itemId et jobId requis." });
  const now = new Date().toISOString();
  try {
    const instruction = `Tu as accès à l'outil Higgsfield job_display via MCP. Appelle job_display avec id="${jobId}" pour récupérer l'état actuel de ce job.

Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, sans balises markdown, au format exact : {"status": "<statut>", "video_url": "<url ou null>"}. Si une erreur survient, réponds avec {"error": "<description courte>"}.`;

    const result = await callClaudeWithHiggsfield(instruction);
    if (result.error) {
      db.prepare("UPDATE items SET hg_error = ?, updated_at = ? WHERE id = ?").run(result.error, now, itemId);
      return res.json({ error: result.error });
    }
    db.prepare(`
      UPDATE items SET hg_status = ?, hg_video_url = ?, hg_error = NULL, updated_at = ? WHERE id = ?
    `).run(result.status, result.video_url || null, now, itemId);
    res.json(result);
  } catch (e) {
    db.prepare("UPDATE items SET hg_error = ?, updated_at = ? WHERE id = ?").run(e.message, now, itemId);
    res.status(200).json({ error: e.message });
  }
});

// ---------- Push notifications ----------

app.get("/api/push/vapid-public-key", requireAuth, (req, res) => {
  res.json({ publicKey: VAPID_KEYS.publicKey });
});

app.post("/api/push/subscribe", requireAuth, (req, res) => {
  const sub = req.body || {};
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return res.status(400).json({ error: "Abonnement invalide." });
  }
  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth
  `).run(sub.endpoint, sub.keys.p256dh, sub.keys.auth, new Date().toISOString());
  res.json({ ok: true });
});

app.post("/api/push/unsubscribe", requireAuth, (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
  res.json({ ok: true });
});

app.get("/api/push/status", requireAuth, (req, res) => {
  const count = db.prepare("SELECT COUNT(*) AS n FROM push_subscriptions").get().n;
  res.json({ subscribed: count > 0 });
});

async function sendPushToAll(payload) {
  const subs = db.prepare("SELECT * FROM push_subscriptions").all();
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(sub.endpoint);
      } else {
        console.error("Erreur envoi push:", e.message);
      }
    }
  }
}

app.post("/api/push/test", requireAuth, async (req, res) => {
  const count = db.prepare("SELECT COUNT(*) AS n FROM push_subscriptions").get().n;
  if (count === 0) {
    return res.status(400).json({ error: "Aucun abonnement actif — active d'abord les notifications." });
  }
  try {
    await sendPushToAll({
      title: "Develupp",
      body: "Notification de test — si tu vois ça, c'est branché 🎉",
      url: "/",
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Daily reminder scheduler ----------

function todayInTimezone(tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`; // YYYY-MM-DD
}

function currentHourInTimezone(tz) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hour12: false }).formatToParts(
    new Date()
  );
  const hourPart = parts.find((p) => p.type === "hour").value;
  return Number(hourPart) % 24;
}

async function runReminderCheck() {
  const hour = currentHourInTimezone(REMINDER_TIMEZONE);
  if (hour !== REMINDER_HOUR) return;

  const today = todayInTimezone(REMINDER_TIMEZONE);
  const due = db
    .prepare(
      `SELECT * FROM items WHERE date = ? AND stage != 'published' AND (reminder_sent_date IS NULL OR reminder_sent_date != ?)`
    )
    .all(today, today);

  if (due.length === 0) return;

  const subCount = db.prepare("SELECT COUNT(*) AS n FROM push_subscriptions").get().n;
  if (subCount === 0) return;

  for (const item of due) {
    const platformLabel = PLATFORM_LABELS[item.platform] || item.platform;
    await sendPushToAll({
      title: "À poster aujourd'hui",
      body: `${platformLabel} — ${item.title || "(sans titre)"}`,
      url: "/",
    });
    db.prepare("UPDATE items SET reminder_sent_date = ? WHERE id = ?").run(today, item.id);
  }
}

const PLATFORM_LABELS = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

setInterval(() => {
  runReminderCheck().catch((e) => console.error("Erreur vérification rappels:", e.message));
}, 15 * 60 * 1000);
// also check once shortly after boot, in case the server restarts right at the reminder hour
setTimeout(() => {
  runReminderCheck().catch((e) => console.error("Erreur vérification rappels:", e.message));
}, 10 * 1000);

// ---------- Static frontend ----------

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Develupp planner en écoute sur le port ${PORT}`);
  console.log(`PUBLIC_URL = ${PUBLIC_URL}`);
});
