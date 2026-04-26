# CLAUDE.md — daems-site

Guide complet pour Claude Code. À relire en début de session pour avoir tout le contexte.

---

## Commandes

```bash
npm run dev       # Vite dev server avec HMR
npm run build     # Build de production
npm run preview   # Prévisualiser le build local
npm run lint      # ESLint (flat config, règles React hooks + refresh)
```

Pas de suite de tests.

---

## Vue d'ensemble

**daems-site** est un SPA React 19 + Vite pour le streamer Twitch **daems_**. Frontend client-side + routes API serverless déployées sur **Vercel**. L'UI est entièrement **en français**.

- URL de prod : déployé via Vercel (branch `main` → auto-deploy)
- Repo GitHub : `SamCapela/daems-website`

---

## Architecture des fichiers

```
src/
  App.jsx          ← TOUT le frontend (~870 lignes, fichier unique)
  index.css        ← Design system : tokens CSS, keyframes, classes réutilisables
  main.jsx         ← Point d'entrée React, monte sur #root
api/
  save-token.js    ← Route admin pour sauver le broadcaster token (protégée par ADMIN_SECRET)
  store-viewer.js  ← Enregistre un viewer dans KV (sub_months, is_sub, etc.)
  recent-activity.js ← Activité récente (subs, gifts, cheers) depuis KV
  sub-count.js     ← Nombre d'abonnés actuel via broadcaster token
  subscribers.js   ← Liste des abonnés
  followers.js     ← Nombre de followers
  bits.js          ← Leaderboard bits
  leaderboard-subs.js ← Classement des subs
public/
  logo-daems.png   ← Logo esport bouclier + "DAEMS" (avec fond blanc — à garder tel quel)
  logo-round.png   ← Tête raton fond violet circulaire (fond opaque)
  racoonsubgift.png ← Image raccoon pour la zone sub gift (page d'accueil)
  favicon.svg      ← Favicon raccoon SVG
index.html         ← Fonts Google (Fredoka + Cinzel + Inter), meta FR, theme-color #0b0914
```

---

## Constantes Twitch (App.jsx top-level)

```js
CLIENT_ID      = "mk16oce917g7q5i485zlyackq33ce0"
BROADCASTER    = "daems_"
BROADCASTER_ID = "441069979"
REDIRECT_URI   = window.location.origin
GOAL_FOLLOWERS = 600
GOAL_SUBS      = 50
SCOPES = ["user:read:email","user:read:follows","user:read:subscriptions","chat:read","chat:edit"]
```

---

## Design system (src/index.css)

### Tokens CSS (`:root`)
```css
--bg-base:          #0b0914   /* fond principal */
--bg-surface:       #13102a
--bg-elevated:      #1c1840
--color-brand:      #7c3aed   /* violet marque */
--color-brand-light:#a78bfa
--color-brand-dim:  rgba(124,58,237,0.14)
--color-accent:     #f97316   /* orange accent */
--color-accent-dim: rgba(249,115,22,0.13)
--color-twitch:     #9147ff   /* violet Twitch */
--color-success:    #10b981
--color-error:      #ef4444
--text-primary:     #f1f0ff
--text-secondary:   #a8a3c7
--text-muted:       #5e5a7e
--font-display:     'Fredoka', sans-serif   /* titres, stats, labels */
--font-banner:      'Cinzel', 'Georgia', serif  /* bannières de pseudo */
--font-body:        'Inter', 'Segoe UI', sans-serif
```

### Keyframes disponibles
`shimmer`, `raccoonFloat`, `underscoreBlink`, `glowPulse`, `giftFloat`, `ticker`, `spin`, `fadeIn`, `fadeInUp`, `pulse`

### Classes CSS réutilisables (index.css)
- Layout : `.app-wrapper`, `.app-header` (fixe, 72px, z-index 100), `.app-main`
- Nav : `.app-nav`, `.nav-tab`, `.nav-tab.active`, `.header-actions`
- Boutons : `.btn`, `.btn-primary`, `.btn-accent`, `.btn-twitch`, `.btn-ghost`, `.btn-sm`
- Login : `.login-page`, `.login-glow-1/2`, `.login-inner`, `.login-text`, `.login-title`, `.login-subtitle`, `.login-features`, `.login-feature`, `.login-feature-dot`, `.login-mascot`, `.login-mascot-glow`, `.raccoon-float`
- Clips : `.clip-card`, `.clip-card:hover`, `.filter-btn`, `.filter-btn.active`
- Shop : `.shop-item`, `.shop-item:hover`
- Chat : `.chat-input`, `.chat-input:focus`
- Menu avatar : `.avatar-dropdown`, `.avatar-menu-link`, `.avatar-menu-btn`

**Règle** : valeurs statiques + pseudo-états (hover, focus) → classes CSS. Valeurs dynamiques (couleurs calculées, largeurs en %) → styles inline.

---

## Frontend — composants (src/App.jsx)

### Hooks custom
- **`useIRC(token, username)`** : WebSocket vers `wss://irc-ws.chat.twitch.tv`. Gère PING/PONG, parsing des tags IRC, extraction des badges, `subMonths` depuis `badge-info`, file de messages locaux avant confirmation IRC. Retourne `{ subMonths, ircMessages, connected, sendIRC, parseBadges }`.

### SVG / Images
- **`RaccoonIcon`** : petite icône raton SVG (viewBox 64×64). Utilisée dans l'empty state clips.
- **`RaccoonMascot`** : grand raton corps entier SVG (viewBox 220×260). Utilisé dans la LoginPage.
- **`DaemsLogo`** : composant texte Fredoka "daems_" avec underscore orange clignotant. Plus utilisé dans la navbar (remplacé par image), mais présent dans la LoginPage.
- **`logo-daems.png`** : logo esport bouclier dans la navbar (overflow au-dessus de la navbar).
- **`logo-round.png`** : tête raton circulaire dans la boutique (animation flottement).

### Système de bannières (5 tiers)
Keyed sur `subMonths` (mois d'abonnement actif). **IMPORTANT : les ex-abonnés n'ont pas de `badge-info` → impossible de détecter leur ancien tier → on n'affiche pas de bannière pour les non-subs.**

| Tier | Nom | Mois | Style |
|------|-----|------|-------|
| 0 | (aucune bannière) | non-sub | — |
| 1 | Bronze | 0–2 | gradient brun-orange |
| 2 | Silver | 3–5 | gradient gris-bleu |
| 3 | Gold | 6–11 | gradient or |
| 4 | Platinum | 12–23 | gradient violet |
| 5 | Diamond | 24+ | gradient sombre + shimmer bleu |

- **`NameBanner`** : bannière grand format (login, profil)
- **`MiniUserBanner`** : bannière inline dans le chat (22px de haut)

### Composants UI
- **`LoadSpinner`** : spinner centré violet
- **`NavBtn`** : bouton ghost petit
- **`Badge`** : petit badge coloré (Follow, Sub)

### Pages
- **`LoginPage`** : hero 2 colonnes — texte + features + bouton Twitch (gauche) / `RaccoonMascot` flottant (droite)
- **`HomePage`** : player Twitch + chat + `ActivityTicker` + jauges objectifs + image raccoon sub gift
- **`ClipsPage`** : grille clips filtrés semaine/mois, pagination curseur
- **`ClipCard`** : carte clip avec thumbnail, vues, date
- **`ShopPage`** : header avec `logo-round.png` flottant + grille 6 items "Bientôt"
- **`TwitchChat`** : chat IRC avec messages locaux optimistes, badges emoji, mini-bannières
- **`ActivityTicker`** : ticker horizontal animé (subs, gifts, cheers)
- **`GoalCard`** : jauge d'objectif (followers 596/600, subs 40/50) avec barre animée
- **`AvatarMenu`** : dropdown avatar avec infos user, lien Twitch, déconnexion

### App (composant racine)
- Auth OAuth : implicit grant flow, token dans `localStorage` clé `tw_token`
- Détecte `access_token` dans le hash URL au retour OAuth
- Charge user info + statut follower + statut sub au montage
- **Bouton "S'abonner"** (orange, `.btn-accent .btn-sm`) dans la navbar → visible uniquement si `!isSub`, pointe vers `https://www.twitch.tv/subs/daems_`
- Navigation par état `tab` ("home" | "clips" | "shop"), pas de router

---

## API routes (api/)

Handlers Vercel standalone. Variables d'env requises :

| Variable | Usage |
|----------|-------|
| `BROADCASTER_TOKEN` | Token OAuth broadcaster pour les appels Helix authentifiés |
| `KV_REST_API_URL` | URL Upstash Redis |
| `KV_REST_API_TOKEN` | Token Upstash Redis |
| `ADMIN_SECRET` | Protège la route `save-token.js` |

Les credentials sont dans `.env.local` (non commité). En prod : tableau de bord Vercel.

---

## Helpers debug (window)

Exposés uniquement en dev/prod pour tester l'UI sans changer de compte :

```js
window.__forceUnsub()   // Force isSub = false → affiche bouton S'abonner dans navbar
window.__resetSub()     // Remet isSub = true
window.__testMsg(name, text, asSub)  // Injecte un faux message IRC dans le chat
```

---

## Points importants à ne pas oublier

1. **Single-file frontend** : tout est dans `src/App.jsx`. Ne pas créer de nouveaux fichiers composants sauf si explicitement demandé.
2. **Pas de deep-link Twitch gift sub** : il n'existe pas d'URL pour ouvrir la popup de cadeau d'abonnement ciblé — lien vers la page channel à la place.
3. **Ex-abonnés indétectables** : `badge-info` IRC ne contient `subscriber/N` que pour les abonnés actifs.
4. **Styling hybride** : classes CSS pour le statique, styles inline pour le dynamique. Ne pas utiliser de lib CSS externe.
5. **Fonts** : Fredoka (display/titres/stats), Cinzel (bannières pseudo uniquement), Inter (body).
6. **Logo navbar** : `logo-daems.png` positionné en overflow au-dessus de la navbar (dépasse intentionnellement la hauteur de 72px).
