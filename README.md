# Develupp — Planning contenu (version hébergée)

App web indépendante de Claude.ai : calendrier de contenu, générateur d'idées,
et lancement de génération vidéo Higgsfield — accessible depuis n'importe quel
appareil via une URL à toi.

## Pourquoi un backend

Deux choses qui marchaient "gratuitement" dans l'artifact Claude.ai ne marchent
plus hors de cet environnement :

1. **Le stockage** (`window.storage`) → remplacé par une vraie base SQLite côté serveur.
2. **L'appel à l'API Anthropic sans clé** → remplacé par un backend qui détient
   ta propre clé API Anthropic (facturée séparément de ton abonnement claude.ai)
   et fait l'appel à ta place.

En plus, connecter Higgsfield en dehors de Claude.ai demande de gérer
toi-même l'authentification OAuth avec Higgsfield (leur MCP fonctionne par
connexion OAuth navigateur, pas par clé API — voir higgsfield.ai/mcp). Le
backend inclus ici fait cette connexion une fois, garde le jeton, et le
rafraîchit automatiquement.

## Architecture

```
develupp-planner/
├── server/        Node/Express — API, base SQLite, proxy Anthropic, OAuth Higgsfield
└── client/        React (Vite) — l'interface, servie par le serveur en production
```

Un seul processus Node sert à la fois l'API et le frontend buildé — pas besoin
d'héberger deux services séparés.

## Prérequis

- Node.js 18+
- Une clé API Anthropic : [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
  (facturation à l'usage, différente de ton abonnement claude.ai — quelques
  centimes par génération de prompt/statut)
- Un compte Higgsfield avec des crédits (celui que tu utilises déjà)

## Développement local

```bash
npm run install:all

# Terminal 1 — backend
cp server/.env.example server/.env
# édite server/.env : PUBLIC_URL=http://localhost:3001, ta clé Anthropic, un mot de passe
npm run dev:server

# Terminal 2 — frontend (hot reload, proxy vers le backend)
npm run dev:client
```

Ouvre `http://localhost:5173`.

## Déploiement (Render, Railway, ou équivalent)

N'importe quel hébergeur Node fonctionne. Étapes génériques :

1. Pousse ce dossier sur un repo Git (GitHub, GitLab...).
2. Crée un nouveau service Web sur ton hébergeur, branché sur ce repo.
3. **Build command** : `npm run build`
4. **Start command** : `npm start`
5. Variables d'environnement à configurer :
   - `ANTHROPIC_API_KEY` — ta clé API
   - `APP_PASSWORD` — le mot de passe pour protéger l'app
   - `PUBLIC_URL` — l'URL HTTPS que ton hébergeur te donne (ex.
     `https://develupp-planner.onrender.com`) — **doit être exacte, sans slash
     final**, c'est l'URL de callback OAuth
   - `NODE_ENV=production`
6. Déploie. Une fois en ligne, ouvre l'URL, entre ton mot de passe.

SQLite écrit un fichier sur disque (`server/data.sqlite`) — assure-toi que
ton hébergeur a un disque persistant (Render "Persistent Disk", Railway
volume...), sinon tes contenus disparaissent à chaque redéploiement.

## Connecter Higgsfield

Dans l'app, une bannière "Connecter Higgsfield" apparaît tant que ce n'est
pas fait. Ça déclenche :

1. Découverte automatique du serveur d'autorisation Higgsfield
2. Enregistrement du client OAuth (dynamique, pas besoin de credentials pré-configurés)
3. Redirection vers l'écran de connexion Higgsfield dans ton navigateur
4. Retour dans l'app, jeton stocké et auto-rafraîchi ensuite

C'est du "best effort" standard (le protocole MCP définit un flux OAuth
normalisé), mais je n'ai pas pu tester ce flux en conditions réelles contre
les serveurs de Higgsfield. **S'il échoue au premier essai**, regarde le
message d'erreur affiché (il vient directement de la réponse de Higgsfield)
et utilise le plan B ci-dessous en attendant, ou pour déboguer.

### Plan B — connexion manuelle si l'OAuth automatique ne passe pas

Anthropic fournit un outil officiel pour obtenir un jeton d'accès à un
serveur MCP protégé par OAuth, utile pour tester :

```bash
npx @modelcontextprotocol/inspector
```

- Transport type : **Streamable HTTP**
- URL : `https://mcp.higgsfield.ai/mcp`
- Clique "Open Auth Settings" → "Quick OAuth Flow" → autorise dans le
  navigateur → suis les étapes jusqu'à "Authentication complete"
- Récupère le `access_token` (et le `refresh_token` si présent) affiché

Colle-les dans l'app via cet appel (remplace les valeurs) :

```bash
curl -X POST https://ton-app.example.com/api/higgsfield/auth/manual \
  -H "Content-Type: application/json" \
  --cookie "session=TON_COOKIE_DE_SESSION" \
  -d '{"access_token": "...", "refresh_token": "...", "expires_in": 3600}'
```

(Le cookie de session s'obtient en te connectant dans le navigateur puis en
copiant le cookie `session` depuis les DevTools.) Ça active immédiatement la
génération/statut, le temps de fiabiliser le flux automatique.

## Sécurité

- L'app entière est derrière un mot de passe partagé (`APP_PASSWORD`) — pense
  à en choisir un solide, ce n'est pas un vrai système multi-utilisateurs.
- La clé Anthropic ne quitte jamais le serveur — le navigateur ne voit que
  tes propres endpoints `/api/...`.
- Le jeton Higgsfield est stocké côté serveur (SQLite), jamais exposé au
  frontend.

## Limites connues

- Les vidéos générées restent brutes : comme dans ton usage actuel, télécharge
  le clip et repasse-le dans ton pipeline ffmpeg pour l'habillage final.
- Mono-utilisateur : pas de comptes séparés, un seul mot de passe partagé.
- Référence API MCP connector si tu veux creuser :
  [docs.anthropic.com/en/docs/agents-and-tools/mcp-connector](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector)
