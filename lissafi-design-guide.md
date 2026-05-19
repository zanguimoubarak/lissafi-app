# Lissafi — Guide de design UI/UX

> **Cible :** Petits commerçants au Cameroun · Android-first · Lisibilité immédiate · Actions en 1 tap

---

## 1. Philosophie de design

Lissafi s'adresse à des marchands qui consultent leur app debout, souvent en plein soleil, entre deux clients. Chaque écran doit répondre à une seule question, les chiffres doivent sauter aux yeux, et chaque action doit se faire en un seul geste.

**Trois mots pour guider chaque décision de design :**

- **Lisible** — un marchand lit son solde en 0,5 seconde
- **Actionnable** — un bouton est toujours visible, jamais caché
- **Humain** — le langage est simple, les erreurs sont expliquées clairement

---

## 2. Palette de couleurs

### Couleurs principales

| Rôle | Nom | Hex | Usage |
|------|-----|-----|-------|
| Primaire | Vert teal | `#1D9E75` | Boutons principaux, accents, solde positif |
| Primaire foncé | Vert forêt | `#0F6E56` | Header, barre de navigation, états actifs |
| Primaire clair | Vert pâle | `#E1F5EE` | Arrière-plans de cartes, badges positifs |
| Fond sombre | Vert nuit | `#111C17` | Fond dark mode, carte hero en mode nuit |

### Couleurs sémantiques

| Rôle | Hex | Usage |
|------|-----|-------|
| VENTE / positif | `#1D9E75` | Pastilles, montants entrants |
| ACHAT / neutre | `#378ADD` | Pastilles achats fournisseurs |
| DÉPENSE / négatif | `#E24B4A` | Montants sortants, alertes stock |
| DETTE / en attente | `#EF9F27` | Badge paiement différé, échéances |
| Info | `#378ADD` | Notifications, tooltips |

### Fond et surfaces

| Rôle | Light mode | Dark mode |
|------|-----------|-----------|
| Fond de page | `#F5F5F0` | `#0E1512` |
| Surface carte | `#FFFFFF` | `#1A2620` |
| Surface secondaire | `#F0F4F2` | `#243028` |
| Bordures | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` |

---

## 3. Typographie

**Police :** Inter (déjà disponible via Expo Google Fonts)

### Hiérarchie des tailles

| Rôle | Taille | Poids | Usage |
|------|--------|-------|-------|
| Montant hero | 36–48px | 700 | Solde du jour sur le home |
| Montant principal | 22–28px | 700 | Montants dans les listes |
| Titre de section | 18px | 600 | En-têtes de section |
| Titre de carte | 16px | 500 | Titre d'une card |
| Corps / label | 14px | 400 | Texte courant, labels |
| Métadonnée | 12px | 400 | Dates, catégories, badges |

### Règle clé

> Les montants en FCFA s'affichent **toujours en gras (700)**. Le cerveau d'un marchand lit les chiffres avant les mots.

Formatage des montants : `1 500 000 FCFA` (espace comme séparateur de milliers, pas de virgule).

---

## 4. Iconographie

**Bibliothèque :** `@expo/vector-icons` — Feather ou MaterialCommunityIcons.

| Écran | Icône recommandée |
|-------|------------------|
| Accueil | `home` |
| Opérations | `trending-up` |
| Stock | `package` |
| Clients | `users` |
| Rapports | `bar-chart-2` |
| Paramètres | `settings` |
| VENTE | `arrow-up-right` (vert) |
| ACHAT | `arrow-down-left` (bleu) |
| DÉPENSE | `minus-circle` (rouge) |
| RECETTE | `plus-circle` (vert) |
| DETTE | `clock` (orange) |
| Alerte stock | `alert-triangle` (rouge) |

**Taille minimum touchable :** 48×48dp (règle Android / accessibilité).

---

## 5. Composants clés

### 5.1 Hero card (home screen)

La carte principale du dashboard. Elle affiche le solde net du jour.

```
┌─────────────────────────────────────────┐
│  Bénéfice du jour          [date] ↻     │
│                                          │
│         + 142 500 FCFA                   │  ← 40px, bold 700, blanc
│                                          │
│  ▲ Recettes    ▼ Dépenses               │
│  185 000       42 500                    │  ← 16px, bold 600
└─────────────────────────────────────────┘
```

- Fond : dégradé `#0F6E56` → `#1D9E75` (seul endroit où un dégradé est autorisé)
- Texte : blanc `#FFFFFF`
- Border-radius : 20px
- Ombre : `0 4px 20px rgba(15, 110, 86, 0.3)`

### 5.2 Grille KPI (sous la hero card)

4 mini-cartes en 2×2 sur fond blanc.

```
┌──────────────┐  ┌──────────────┐
│ 🟢 Ventes    │  │ 🔵 Achats    │
│  185 000     │  │   67 000     │
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│ 🔴 Dépenses  │  │ 🟠 Dettes    │
│   42 500     │  │   15 000     │
└──────────────┘  └──────────────┘
```

- Border-radius : 12px
- Padding : 12px 14px
- Label : 12px, gris secondaire
- Montant : 18px, bold 600, couleur sémantique

### 5.3 Item de liste (opérations)

```
┌──────────────────────────────────────────────────┐
│ [●] Article ou description    [+185 000 FCFA]    │
│     Aujourd'hui · 14:32       VENTE  ●vert       │
└──────────────────────────────────────────────────┘
```

- Pastille colorée à gauche (8px, couleur sémantique du type)
- Montant à droite, bold, couleur sémantique
- Séparateur fin (`0.5px`) entre chaque item
- Groupement par section : **Aujourd'hui**, **Hier**, **Lun 12 mai...**

### 5.4 Carte produit (grille stock)

Grille 2 colonnes dans l'écran stock.

```
┌─────────────────┐
│  [nom produit]  │
│  Sucre 1kg      │
│                 │
│  Vente: 750 F   │
│  Achat: 600 F   │
│                 │
│  [██████░░] 12  │  ← barre de stock
│  ⚠ Seuil: 10   │
└─────────────────┘
```

- Badge de stock :
  - Vert `#1D9E75` : stock > seuil d'alerte
  - Orange `#EF9F27` : stock ≤ seuil d'alerte (×2)
  - Rouge `#E24B4A` : stock ≤ seuil ou rupture
- Border-radius : 14px

### 5.5 Bouton d'action flottant (FAB)

Un seul FAB vert toujours visible sur les écrans liste.

```
                    ╭──────────────╮
                    │  +  Ajouter  │  ← 56px de hauteur
                    ╰──────────────╯
```

- Fond : `#1D9E75`
- Texte : blanc, 15px, medium 500
- Position : bottom-right, `margin: 0 20px 24px 0`
- Ombre : `0 4px 16px rgba(29, 158, 117, 0.4)`
- Haptics : `expo-haptics` léger au tap

---

## 6. Navigation

### Structure (bottom tab bar)

```
[🏠 Accueil]  [📊 Opérations]  [📦 Stock]  [👤 Profil]
```

4 onglets maximum. Les clients, charges et rapports sont accessibles via des raccourcis sur le home ou via le profil — pas dans la barre principale (trop chargé).

### Règles de navigation

- **Transitions :** `slide_from_right` pour toutes les pages internes (déjà configuré dans `_layout.tsx`)
- **Modals :** bottom sheet pour les formulaires d'ajout (new-operation, new-product)
- **Retour :** geste swipe-back natif, jamais de bouton Annuler affiché seul

---

## 7. Formulaires

Règle d'or : **un écran = une seule info à saisir** (wizard plutôt que formulaire long).

### Ordre de saisie pour une opération

1. Type (VENTE / ACHAT / DÉPENSE / RECETTE) — gros boutons visuels
2. Nom de l'article — clavier alphanumérique
3. Montant — clavier numérique, plein écran
4. Détails optionnels (quantité, mode de paiement, commentaire) — accordéon

### Style des champs

- Height : 56px minimum
- Border : `1.5px solid` en focus (couleur primaire)
- Label : au-dessus du champ (jamais placeholder seul)
- Erreur : texte rouge sous le champ + bordure rouge

---

## 8. États et feedback

| Situation | Feedback attendu |
|-----------|-----------------|
| Opération enregistrée | ✅ Toast vert + vibration légère (haptics) |
| Erreur réseau | ⚠️ Banner orange avec bouton "Réessayer" |
| Limite plan FREE atteinte | 🔒 Bottom sheet avec CTA "Passer à Pro" |
| Stock sous seuil | 🔴 Badge rouge sur l'icône Stock dans la nav |
| Chargement | Skeleton screens (pas de spinner générique) |
| Formulaire invalide | Champs en rouge + message explicite en français |

---

## 9. Mode sombre

Le dark mode utilise un fond vert très sombre (`#111C17`) qui renforce l'identité de la marque tout en étant confortable la nuit.

| Élément | Light | Dark |
|---------|-------|------|
| Fond de page | `#F5F5F0` | `#0E1512` |
| Carte | `#FFFFFF` | `#1A2620` |
| Texte principal | `#0E1512` | `#F0F4F2` |
| Texte secondaire | `#6B7280` | `#9CA3AF` |
| Hero card | gradient vert | même gradient (inchangé) |

Implémentation via `useColorScheme()` déjà en place dans le projet.

---

## 10. Accessibilité

- **Taille de cible minimale :** 48×48dp sur tous les éléments interactifs
- **Contraste :** ratio ≥ 4.5:1 pour le texte normal, ≥ 3:1 pour le texte large
- **Labels accessibles :** chaque icône sans texte doit avoir un `accessibilityLabel`
- **Police :** respecter le scaling système (`allowFontScaling` non désactivé)
- **Couleur seule :** ne jamais utiliser la couleur comme seul indicateur (toujours doubler avec une icône ou un label)

---

## 11. Références d'inspiration

| App | Ce qu'on en prend |
|-----|------------------|
| **Moniepoint** | Structure dashboard, vert primaire, navigation marchands |
| **Revolut Business** | Liste transactions, pastilles colorées, groupement par date |
| **Monzo** | Ton chaleureux, onboarding progressif, clarté |
| **Stockey (Dribbble)** | Grille produits, badges stock, barre de progression |
| **Square / QuickSell** | FAB, formulaires courts, confirmation immédiate |
| **Material You** | Bento-grid home, transitions fluides, accessibilité Android |

---

*Document généré le 17 mai 2026 — Version 1.0*
