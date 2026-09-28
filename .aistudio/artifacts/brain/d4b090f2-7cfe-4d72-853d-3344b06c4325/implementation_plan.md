# Plan d'Actions Priorisé — Audit Global 360° CraftGrid Studio

Ce plan synthétise les recommandations issues de l'audit 360° (Architecture, Sécurité, Performance, Fiabilité IA et Accessibilité/UX) pour CraftGrid Studio.

---

## 1. Priorité 1 — Sécurité & Résilience Réseau (Immédiat)

### 1.1 Sécurisation des En-têtes HTTP (Helmet / Security Headers)
- **Constat** : Le serveur Express (`server.ts`) n'applique pas d'en-têtes HTTP de sécurité standards (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Content-Security-Policy`).
- **Action** : Ajouter un middleware d'en-têtes de sécurité dans `server.ts` pour empêcher le sniffing de type MIME, le clickjacking et durcir les communications.

### 1.2 Limitation de Débit Globale côté API (Rate Limiting)
- **Constat** : Bien que le système de cooldown protège l'API externe Gemini contre les erreurs 429/503, les endpoints `/api/*` n'ont pas de limitation de requêtes par client IP.
- **Action** : Ajouter une limitation de débit en mémoire (ex: 60 requêtes/minute par IP) pour éviter les abus ou les attaques par déni de service local.

### 1.3 Validation Stricte des Schémas d'Entrée API (Input Sanitization)
- **Constat** : `prompt`, `size`, `frameCount` et `currentMatrix` sont vérifiés manuellement de manière partielle.
- **Action** : Valider rigoureusement les types, dimensions maximales (ex: 64x64 max, 8 frames max) et caractères acceptés afin d'éviter les payloads malveillants ou surdimensionnés.

---

## 2. Priorité 2 — Performance & Gestion Mémoire (Court terme)

### 2.1 Optimisation du Stockage Local (localStorage Footprint)
- **Constat** : `App.tsx` sérialise l'intégralité du catalogue (100 icônes avec matrices et SVG) dans `localStorage`. Si l'utilisateur édite de nombreux sprites haute résolution (32x32 ou 64x64), la limite de 5 Mo de `localStorage` peut être atteinte.
- **Action** : Ne persister dans `localStorage` que les modifications delta (icônes personnalisées, favoris et overrides de matrices) plutôt que de répliquer l'intégralité des 100 icônes canoniques statiques.

### 2.2 Mémoïsation des Composants de Grille & Virtualisation
- **Constat** : Dans le catalogue (`App.tsx`), le basculement d'icône active ou le filtrage déclenche des rendus de multiples instances `PixelIconRenderer`.
- **Action** : Envelopper `PixelIconRenderer` avec `React.memo` et une fonction de comparaison légère sur `icon.id`, `icon.art`, `isSelected` et `isFavorite`.

### 2.3 Nettoyage Automatique des Ressources Canvas & Object URLs
- **Constat** : `animationExport.ts` et `svgToPng.ts` créent des éléments canvas et des data URLs.
- **Action** : Réutiliser un canvas singleton ou libérer explicitement la mémoire lors des exports répétés en boucle.

---

## 3. Priorité 3 — Robustesse IA & Continuité Moteur Procédural

### 3.1 Détection Prédictive des Quotas & Fallback Hybride Transparent
- **Constat** : Les mécanismes de cooldown 429/503 et de parsing résilient `safeParseJson` sont déjà en place et fonctionnels.
- **Action** : Étendre le pool de concepts procéduraux (`RANDOM_CONCEPTS`) pour couvrir 100% des types d'items fantastiques/Minecraft (arcs, armures, créatures, blocs complexes).

---

## 4. Priorité 4 — Accessibilité & Expérience Utilisateur (UX)

### 4.1 Contrastes et Rôles ARIA
- **Constat** : Certains badges et libellés dans les panneaux d'outils ont un contraste couleur légèrement inférieur au seuil WCAG AA (4.5:1) sur fond sombre.
- **Action** : Ajuster les couleurs de texte `#869392` vers `#A3B1B0` pour satisfaire strictement WCAG 2.1 AA.
- **Action** : Compléter les attributs `aria-label` et `aria-pressed` sur les sélecteurs d'outils et de frames.

---

## Calendrier d'Exécution Proposé
1. Étape 1 : Sécurisation API & En-têtes HTTP (`server.ts`).
2. Étape 2 : Optimisation delta de `localStorage` et mémoïsation de `PixelIconRenderer`.
3. Étape 3 : Ajustements contrastes et accessibilité ARIA.
4. Étape 4 : Validation `lint`, `build` et tests d'intégration.
