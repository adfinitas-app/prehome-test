# 🚀 Prehome Generator

> Un script, des campagnes infinies. Deploy tes interstitiels en 2 min.

## 📋 Table des matières

- [Architecture](#architecture)
- [Quick Start](#-quick-start)
- [Créer une Route](#-créer-une-route)
- [Déploiement](#-déploiement)
- [Intégration Client](#-intégration-client)
- [Troubleshooting](#-troubleshooting)
- [Structure Fichiers](#-structure-fichiers)
- [Tips](#-tips)
- [Naming Convention](#-naming-convention)

---

## Architecture

**Stack :** Svelte 5 + Firebase Hosting + Script Loader autonome

- **Script Loader** (`main.ts`) : Gestion capping, détection plateforme, injection iframe
- **Routes Svelte** : Chaque dossier = une campagne déployée

**Flow :** Client charge ton script → Script injecte iframe → Iframe charge ta campagne Svelte

---

## ⚡ Quick Start

**Prérequis :** Node 20+, Java, Firebase CLI, `jq`, `gum`

**Java**

```bash
 brew install openjdk@21
```

```bash
npm login # Pour your-client-id-ui (utiliser l'otp reçu sur developer@your-client-id.fr)
npm install
npm run prepare  # Configure Husky hooks
npm run dev  # Lance le générateur + toutes les routes
```

---

## 📁 Créer une Route

**Structure :** `src/routes/[ta-route]/+page.svelte`

```
src/routes/
├── careme/+page.svelte
├── newsletter/+page.svelte
├── newsletter/v2/+page.svelte
└── promo-noel/+page.svelte
```

### Exemple minimal

```svelte
<script>
	import { page } from '$app/state';
	import Prehome from '$lib/components/Prehome.svelte';
	import Icon from '@iconify/svelte';

	const routeName = page.url.pathname.split('/').filter(Boolean).join('-');
	const queryParams = page.url.searchParams;
	const maxViews = queryParams.get('maxViews');
	const clientId = queryParams.get('configClientId');
	const customTitle = queryParams.get('title');

	function close() {
		window.parent.postMessage({ type: `close-iframe-prehome-${routeName}` }, '*');
	}
</script>

<Prehome routeName="newsletter" backgroundColor="rgba(0,0,0,0.8)">
	<h1>Abonne-toi !</h1>
	<button onclick={close}>✕</button>
</Prehome>
```

**Auto-détection :** Ta route apparaît instantanément dans le générateur (HMR).

**Versioning :** Use `/newsletter/v1`, `/v2` pour itérer sans casser l'existant.

---

## 🔥 Déploiement

### Commands

| Commande                 | Usage                                     |
| ------------------------ | ----------------------------------------- |
| `npm run deploy`         | Prod : Nouveau site ou mise à jour        |
| `npm run deploy:preview` | Preview temporaire (expire après X jours) |
| `npm run cleanup`        | Supprime un site Firebase                 |

⚠️ **JAMAIS de `firebase deploy` manuel** — Tout est scripté.

### Workflow

**Premier deploy :**

```bash
npm run deploy
# → Choisis clientId (spa, frm, omf...)
# → Crée 25-spa-prehome.web.app
# → Déploie TOUTES les routes (careme, newsletter, newsletter/v2...)
```

**Redéploy :**

```bash
npm run deploy
# → Détecte le site actuel
# → Push que les fichiers modifiés
```

**Preview éphémère :**

```bash
npm run deploy:preview
# → Channel temporaire : preview-20250128143022
# → Expire après 7 jours (configurable)
```

---

## 🧩 Intégration Client

Use le **Prehome Generator** (à la racine du site déployé ou en local) pour générer les tags.

### Config

- **Route** : `careme`, `newsletter`, `newsletter/v2`...
- **Plateforme** : GTM, Beyable, Script pur
- **Type** : Static ou SPA
- **Capping** : Jours avant ré-affichage (GTM/Script uniquement)
- **Vues max** : Affichages max par cycle

### Formats

**GTM (HTML)**

```html
<script
	src="https://25-spa-prehome.web.app/prehome/main.js"
	data-host="25-spa-prehome.web.app"
	data-route="newsletter"
	data-platform="gtm"
	data-type="static"
	data-capping="7"
	data-max-views="1"
></script>
```

**Beyable** (pas de capping)

```javascript
(function (SId, CId) {
	var s = document.createElement('script');
	s.src = 'https://25-spa-prehome.web.app/prehome/main.js';
	s.dataset.host = '25-spa-prehome.web.app';
	s.dataset.route = 'careme';
	s.dataset.platform = 'beyable';
	s.dataset.type = 'static';
	document.head.appendChild(s);
})(SId, CId);
```

**Script Direct** (test console)

```javascript
var s = document.createElement('script');
s.src = 'https://25-spa-prehome.web.app/prehome/main.js';
s.dataset.host = '25-spa-prehome.web.app';
s.dataset.route = 'newsletter/v2';
s.dataset.platform = 'gtm';
s.dataset.type = 'spa';
s.dataset.capping = '1';
s.dataset.maxViews = '3';
document.body.appendChild(s);
```

---

## 🔧 Troubleshooting

### Capping inactif

- Mode `beyable` ? Normal, Beyable gère le capping
- Logs console (dev) : `[Prehome] Capping atteint...`
- Reset : Vider LocalStorage + cookies

### Deploy fail (EBADENGINE)

Mauvaise version Node.

**Fix :** `nvm use 20`

### Conflit `firebase.json`

Normal en multi-dev. Relance `npm run deploy` pour régénérer ta config.

---

## 📦 Structure Fichiers

```
Prehome/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte         # Layout global
│   │   ├── +page.svelte           # Générateur de scripts (racine)
│   │   ├── default/
│   │   │   └── +page.svelte       # Route exemple
│   │   └── features/
│   │       └── custom-close-btn/
│   │           └── +page.svelte   # Route avec bouton custom
│   ├── lib/
│   │   ├── components/
│   │   │   └── Prehome.svelte     # Composant principal
│   │   ├── index.ts
│   │   └── types.ts
│   ├── app.html                   # Template HTML
│   ├── app.css                    # Styles globaux
│   └── iframe.ts                  # Entry point iframe
├── static/
│   ├── assets/
│   │   ├── default/
│   │   │   ├── images/            # Images route default
│   │   │   └── fonts/             # Fonts route default
│   │   └── features/
│   │       └── custom-close-btn/
│   │           ├── images/
│   │           └── fonts/
│   ├── prehome/
│   │   └── main.js                # Script loader (copié au build)
│   └── favicon.svg
├── build/                         # Dossier de build (généré)
│   ├── _app/                      # Assets SvelteKit
│   ├── assets/                    # Assets statiques copiés
│   ├── prehome/
│   │   └── main.js                # Script loader (production)
│   └── index.html
├── scripts/
│   ├── deploy.sh                  # Deploy principal
│   ├── preview.sh                 # Deploy preview temporaire
│   ├── cleanup.sh                 # Suppression site Firebase
│   └── sync-assets-folders.ts     # Auto-génération assets
├── firebase.json                  # Config Firebase (auto-géré)
├── .firebaserc                    # Alias projet (auto-géré)
├── vite.config.ts                 # Config Vite principale
├── vite.config.iframe.ts          # Config build iframe
├── svelte.config.js               # Config SvelteKit
└── package.json
```

---

## 💡 Tips

### Fermer la Prehome depuis ton composant

Le composant `<Prehome>` gère déjà la fermeture avec un bouton ✕ en haut à droite.

**Message envoyé :** `close-iframe-prehome-${routeName}`

Si tu veux trigger la fermeture depuis ton code :

```svelte
<script>
	const routeName = 'newsletter'; // Ton routeName

	function close() {
		window.parent.postMessage({ type: `close-iframe-prehome-${routeName}` }, '*');
	}
</script>

<button onclick={close}>Fermer</button>
```

⚠️ Le `routeName` **doit matcher** celui passé au composant `<Prehome>`.

### Type d'intégration

- **Static** : Sites classiques, reload complet de page
- **SPA** : Single Page Apps (React, Vue...), use `MutationObserver` pour détecter les changements de route

---

## 🎯 Naming Convention

**Sites Firebase :** `YY-clientId-prehome`

Exemples :

- `25-spa-prehome` → SPA 2025
- `25-frm-prehome` → Fondation Raoul Follereau 2025
- `26-omf-prehome` → Ordre de Malte France 2026

**1 hosting = 1 client/an** → Toutes les routes du client pour l'année.

---

## 📜 Scripts disponibles

### Development

```bash
npm run dev              # Lance le serveur de dev
npm run build            # Build production (iframe + app)
npm run preview          # Preview du build local
npm run iframe           # Build uniquement l'iframe
```

### Deployment

```bash
npm run deploy           # Deploy prod (nouveau ou update)
npm run deploy:preview   # Deploy preview temporaire
npm run cleanup          # Supprime un site Firebase
```

### Maintenance

```bash
npm run check            # Vérification TypeScript
npm run check:watch      # Vérification en mode watch
npm run format           # Formate le code (Prettier)
npm run lint             # Lint le code (ESLint + Prettier)
npm run setup            # Réinstalle les dépendances
```

---

## 🔒 Pre-commit Hooks

Le projet utilise Husky pour automatiser le formatage et le linting avant chaque commit :

- **Prettier** : Formate automatiquement les fichiers modifiés
- **ESLint** : Vérifie et corrige les erreurs JS/TS

Les hooks sont configurés dans `.husky/pre-commit`.

---

## 🏗️ Configuration

### Vite Config (`vite.config.ts`)

- **TailwindCSS** : Via plugin Vite
- **Image Optimizer** : Compression automatique des images (JPEG, PNG, SVG)
- **Assets Sync** : Création automatique des dossiers `static/assets/{route}/{images,fonts}`
- **Watch Routes** : Détection des ajouts/suppressions de routes

#### 📂 Système d'auto-génération des assets

Le projet inclut un système intelligent qui crée automatiquement la structure de dossiers pour les assets de chaque route.

**Fonctionnement :**

1. **Au démarrage** (`npm run dev` / `npm run build`) :
   - Scan de tous les fichiers `+page.svelte` dans `src/routes/`
   - Création automatique de `static/assets/{route}/images/` et `static/assets/{route}/fonts/`
   - Ajout d'un fichier `.gitkeep` pour préserver la structure Git

2. **En temps réel (dev uniquement)** :
   - **Nouvelle route créée** → Dossiers assets générés instantanément
   - **Route supprimée** → Dossiers assets nettoyés automatiquement

**Exemple :**

```bash
# Tu crées src/routes/newsletter/+page.svelte
# → Génère automatiquement :
static/assets/newsletter/images/.gitkeep
static/assets/newsletter/fonts/.gitkeep

# Tu supprimes src/routes/newsletter/+page.svelte
# → Supprime automatiquement :
static/assets/newsletter/
```

**Structure générée :**

```
static/assets/
├── careme/
│   ├── images/
│   │   └── .gitkeep
│   └── fonts/
│       └── .gitkeep
├── newsletter/
│   ├── images/
│   │   └── hero.jpg
│   └── fonts/
│       └── custom.woff2
└── newsletter/v2/
    ├── images/
    └── fonts/
```

**Script source :** `scripts/sync-assets-folders.ts`

- `syncAssetsFolders()` : Scan et création
- `deleteAssetsFolders()` : Nettoyage automatique

⚠️ **Important :** Ne crée jamais manuellement ces dossiers, le système s'en charge.

### Firebase Config

Géré automatiquement par les scripts de déploiement. Ne pas modifier manuellement :

- `firebase.json` : Configuration du site actif
- `.firebaserc` : Alias et targets Firebase

---

## 🎨 Clients disponibles

Liste des `clientId` valides pour le déploiement :

```
your-client-id, arc, arsla, avh, ccfd, cimade, ffom, faf,
frm, icm, ilot, ipl, lcde, mdp, msf, omf, pfp,
sidaction, snsm, spa, unhcr, vnf
```

---

## 📝 License

Propriétaire - Adfinitas
