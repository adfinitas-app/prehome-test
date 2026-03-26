# Workflow de contribution

Ce document est la **recette à suivre à la lettre**. Chaque étape est obligatoire, dans l'ordre indiqué.

---

## Règles non négociables

- **On ne pousse jamais directement sur `main`** — c'est bloqué par GitHub.
- **Toute modification passe par une branche et une Pull Request.**
- **Toute PR doit être approuvée** par au moins un admin avant le merge.
- **On ne merge jamais sa propre PR** — même si on en a les droits.

---

## Recette complète

### Étape 1 — Se mettre à jour

Avant de commencer quoi que ce soit, synchronise ton `main` local :

```bash
git checkout main
git pull
```

> Si tu as des modifications non commitées sur `main`, quelque chose s'est mal passé. Contacte un admin avant de continuer.

---

### Étape 2 — Créer une branche

```bash
git checkout -b {nom-de-branche}
```

**Règles de nommage :**

- Minuscules, chiffres, tirets uniquement
- Court et descriptif
- Pas d'espaces, pas d'accents, pas de slashes

| ✅ Correct             | ❌ Incorrect  |
| ---------------------- | ------------- |
| `careme-2027`          | `Carême 2027` |
| `fix-bouton-mobile`    | `fix/bouton`  |
| `newsletter-printemps` | `ma_branche`  |

---

### Étape 3 — Lancer le serveur local

```bash
npm run dev
```

Ouvre **http://localhost:5173**.

> Si `npm run dev` échoue avec `EBADENGINE` : lance `nvm use 20` puis réessaie.
> Si `node_modules` est absent : lance `npm install` d'abord (sans `--ignore-scripts`).

---

### Étape 4 — Développer

Crée ou modifie des fichiers **uniquement** dans :

- `src/routes/{année}/{nomCampagne}/` — le code de la popup
- `static/assets/{année}/{nomCampagne}/` — les images et polices

**Ne touche jamais à :**

- `src/lib/components/Prehome.svelte`
- `static/prehome/main.js`
- `firebase.json`, `.firebaserc`
- `src/lib/.prehome-config.json`

Pour créer une nouvelle campagne, suis les étapes 1 à 4 de la section **"Créer une campagne"** dans le [README](./README.md).

---

### Étape 5 — Committer

```bash
git add .
git commit -m "{préfixe}: {description courte}"
```

**Format obligatoire des messages de commit :**

| Préfixe  | Quand l'utiliser                           |
| -------- | ------------------------------------------ |
| `feat:`  | Nouvelle campagne, nouvelle fonctionnalité |
| `fix:`   | Correction d'un bug                        |
| `chore:` | Dépendances, config, maintenance           |
| `docs:`  | README, commentaires                       |

Exemples valides :

```
feat: ajout campagne careme 2027
fix: bouton fermeture invisible sur mobile
chore: mise a jour tailwind
```

> **Si le commit est bloqué :** il y a une erreur ESLint que le hook ne peut pas corriger seul.
> Lis le message d'erreur dans le terminal, corrige le fichier indiqué, puis `git add .` et recommitte.
> Ne jamais utiliser `--no-verify` pour contourner le hook.

---

### Étape 6 — Pousser

```bash
git push origin {nom-de-branche}
```

**Ce qui se passe automatiquement dans les 2-3 minutes :**

1. La CI lance le build
2. Une preview Firebase est déployée (valable 7 jours)
3. Une Pull Request draft est créée avec l'URL de preview en commentaire

Tu n'as rien d'autre à faire pour déclencher ça.

> **Si la CI est rouge :** va sur GitHub → onglet **Actions** → clique sur le job en échec → lis les logs de l'étape rouge. Corrige, committe, pousse à nouveau sur la même branche.

---

### Étape 7 — Demander une review

1. Va sur **github.com/your-client-id-app/{clientId}-prehome → Pull Requests**
2. Ouvre ta PR (elle est en draft)
3. Clique **"Ready for review"** pour la sortir du mode draft
4. Assigne un admin en reviewer
5. Partage l'URL de preview avec le/les admin ou le client pour validation visuelle

> Chaque nouveau push sur ta branche met à jour la preview automatiquement.
> Réponds aux retours de l'admin en commitant et poussant sur la même branche — ne recrée pas une nouvelle branche.

---

### Étape 8 — Merge (admins uniquement)

L'admin approuve et merge la PR sur `main`.

**Tu ne merges pas toi-même**, même si GitHub te le permet.

**Ce qui se passe automatiquement après le merge :**

1. La CI lance le build de production
2. La popup est déployée en production (~2 min)
3. URL de production : `https://{clientId}-prehome.web.app`

---

## Résumé en un coup d'œil

```
git checkout main && git pull
git checkout -b {nom-de-branche}
→ développer (src/routes/ et static/assets/ uniquement)
git add . && git commit -m "feat: description"
git push origin {nom-de-branche}
→ Preview déployée + PR draft créée automatiquement
→ Sortir du draft → assigner un admin → répondre aux retours
→ L'admin  merge → prod automatique
```

---

## Environnements

| Contexte       | URL                                         | Déclenché par                 |
| -------------- | ------------------------------------------- | ----------------------------- |
| **Production** | `https://{clientId}-prehome.web.app`        | Merge sur `main` par un admin |
| **Preview**    | URL temporaire dans le commentaire de la PR | Tout push sur une branche     |

---

## Résolution des problèmes courants

| Symptôme                    | Solution                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Commit bloqué               | Lis l'erreur ESLint, corrige le fichier, recommitte — ne jamais utiliser `--no-verify` |
| CI rouge                    | Onglet Actions → job rouge → logs → corrige → pousse à nouveau                         |
| Conflit de merge            | Résous localement, pousse à nouveau — ne force jamais (`--force`)                      |
| Conflit sur `firebase.json` | Prends toujours la version de `main` (incoming)                                        |
| `EBADENGINE` au démarrage   | `nvm use 20`                                                                           |
| `node_modules` absent       | `npm install` (sans `--ignore-scripts`)                                                |
| Besoin d'aide               | Contacte l'admin du projet                                                             |
