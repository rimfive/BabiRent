# CLAUDE.md — Babi Rent

Ce fichier est lu automatiquement par Claude Code à chaque session.
**NE PAS SUPPRIMER** — c'est la mémoire permanente du projet.

---

## 🎯 Vision du Projet

**Babi Rent** est une marketplace africaine de location. Inspiré de Airbnb + Turo combinés.
= Location de voitures + logements (courte ET longue durée) + autres catégories.

**Objectif MVP** : lancer dans un seul pays, puis étendre.

---

## 📱 Stack Technique

- **Framework** : React Native + Expo SDK 54 (TypeScript strict)
- **Backend** : Firebase (Firestore + Auth + Storage + Functions)
- **Paiement africain** : CinetPay (Orange Money, MTN MoMo, Wave, Moov)
- **Paiement carte** : Stripe
- **Cartes** : Google Maps SDK
- **Photos** : Cloudinary
- **État global** : Zustand
- **Navigation** : Expo Router v4 (Stack + Bottom Tabs)
- **Formulaires** : React Hook Form

---

## 📁 Structure des Dossiers

```
BabiRent/
├── app/
│   ├── (auth)/
│   │   ├── splash.tsx          ← Splash Screen (logo animé)
│   │   ├── onboarding.tsx      ← 3 slides première ouverture
│   │   ├── welcome.tsx         ← Connexion + Inscription (toggle animé)
│   │   ├── login.tsx           ← Connexion seule
│   │   └── register.tsx        ← Inscription seule
│   ├── (tabs)/
│   │   ├── _layout.tsx         ← Barre de navigation bas
│   │   ├── index.tsx           ← Home (véhicules + logements)
│   │   ├── explore.tsx         ← Favoris
│   │   ├── publier.tsx         ← Redirection vers le bon formulaire
│   │   ├── chat.tsx            ← Messagerie
│   │   └── profile.tsx         ← Profil
│   ├── vehicule/
│   │   ├── [id].tsx            ← Détail véhicule
│   │   └── publier.tsx         ← Publier une annonce véhicule
│   ├── logement/
│   │   ├── [id].tsx            ← Détail logement
│   │   └── publier.tsx         ← Publier une annonce logement
│   ├── reservation/
│   │   └── [id].tsx            ← Détail réservation
│   ├── _layout.tsx             ← Layout racine
│   └── index.tsx               ← Redirige vers splash
├── src/
│   ├── config/
│   │   ├── firebase.ts         ← Config Firebase (clés depuis .env)
│   │   ├── colors.ts           ← Palette dark navy + orange
│   │   └── constantes.ts       ← Villes, marques, types...
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Bouton.tsx      ← Bouton réutilisable
│   │   │   ├── ChampTexte.tsx  ← Input réutilisable
│   │   │   └── Badge.tsx       ← Badge statut
│   │   ├── vehicule/
│   │   │   └── CarteVehicule.tsx
│   │   └── logement/
│   │       └── CarteLogement.tsx
│   ├── hooks/
│   │   ├── useAuth.ts          ← Surveillance Firebase Auth
│   │   └── useListings.ts
│   ├── services/
│   │   ├── auth.service.ts     ← connecter, inscrire, déconnecter
│   │   ├── vehicule.service.ts ← CRUD véhicules Firestore
│   │   ├── logement.service.ts ← CRUD logements Firestore
│   │   └── reservation.service.ts
│   ├── store/
│   │   ├── useAuthStore.ts     ← État utilisateur connecté
│   │   └── useAppStore.ts      ← Section active (véhicules/logements)
│   └── types/
│       └── index.ts            ← Types TypeScript complets
├── .env                        ← JAMAIS sur GitHub
├── .env.example                ← Version sans valeurs → OK sur GitHub
├── .gitignore
├── CLAUDE.md                   ← Ce fichier
├── app.json
└── package.json
```

---

## 🎨 Couleurs Babi Rent

```ts
// Thème dark navy + orange — fichier : src/config/colors.ts
primary: '#1B3570'       // Navy principal
accent: '#E87722'        // Orange accent (CTA, boutons)
background: '#0E1A2E'    // Fond général (dark navy)
card: '#162440'          // Fond des cartes
white: '#FFFFFF'
textPrimary: '#FFFFFF'
textSecondary: 'rgba(255,255,255,0.65)'
glass: 'rgba(255,255,255,0.08)'
glassBorder: 'rgba(255,255,255,0.20)'
success: '#10B981'
error: '#EF4444'
```

---

## 📦 Collections Firestore

```
users/          → Profils utilisateurs
vehicules/      → Annonces véhicules
logements/      → Annonces logements
reservations/   → Réservations
conversations/  → Chats entre utilisateurs
messages/       → Messages dans un chat
avis/           → Avis après location
transactions/   → Historique des paiements
```

---

## 👥 Rôles Utilisateurs

- `LOUEUR` → cherche et réserve des annonces
- `PROPRIÉTAIRE` → publie et gère ses annonces

Un utilisateur peut avoir les deux rôles et switcher depuis son profil.

---

## 🔒 Règles de Sécurité ABSOLUES

1. Toutes les clés API dans `.env` UNIQUEMENT
2. Variables : `process.env.EXPO_PUBLIC_...` côté app
3. Clés secrètes (CinetPay, Stripe) : Firebase Cloud Functions SEULEMENT
4. Firebase Security Rules : jamais `allow read, write: if true`
5. Toujours `try/catch` sur les appels Firebase
6. Toujours valider les données des formulaires avant envoi
7. Ne jamais stocker les mots de passe — Firebase Auth s'en charge

---

## 💳 Paiements

- **CinetPay** → Orange Money, MTN MoMo, Wave, Moov Money
- **Stripe** → Carte Visa / Mastercard

Les deux UNIQUEMENT via Firebase Cloud Functions (jamais côté app directement).

---

## 👤 Mon Niveau & Préférences

- Débutant en React Native
- Je connais VS Code et les bases de JavaScript
- Génère du code commenté en français
- Explique les parties importantes
- **Procède étape par étape — un fichier à la fois**
- Utilise toujours TypeScript strict
- Utilise les couleurs de `src/config/colors.ts`
- Utilise les composants `Bouton` et `ChampTexte` déjà créés

---

## ✅ Avancement du Projet

### Phase 1 — Fondations ✅ COMPLÈTE
- [x] `src/types/index.ts`
- [x] `src/config/colors.ts`
- [x] `src/config/constantes.ts`
- [x] `src/config/firebase.ts`

### Phase 2 — Composants de base ✅ COMPLÈTE
- [x] `src/components/ui/Bouton.tsx`
- [x] `src/components/ui/ChampTexte.tsx`
- [x] `src/components/vehicule/CarteVehicule.tsx`
- [x] `src/components/logement/CarteLogement.tsx`

### Phase 3 — Authentification (EN COURS)
- [x] `app/(auth)/splash.tsx` ← Logo animé + redirection
- [x] `app/(auth)/onboarding.tsx` ← 3 slides première ouverture
- [x] `app/(auth)/welcome.tsx` ← Connexion + Inscription toggle
- [x] `app/(auth)/login.tsx`
- [x] `app/(auth)/register.tsx`
- [x] `app/(auth)/otp.tsx` ← Vérification SMS 6 cases + minuterie

### Phase 4 — Navigation
- [x] `app/(tabs)/_layout.tsx` ← Tab bar dark navy

### Phase 5 — Écrans principaux
- [x] `app/(tabs)/index.tsx` ← Home véhicules + logements
- [x] `app/vehicule/[id].tsx` ← Détail véhicule complet
- [x] `app/logement/[id].tsx` ← Détail logement complet
- [ ] Écran recherche + filtres

### Phase 6 — Réservation & Paiement
- [ ] Sélection de dates (calendrier)
- [ ] Récapitulatif réservation
- [ ] Écran paiement (CinetPay + Stripe)
- [ ] Confirmation réservation

### Phase 7 — Chat & Profil
- [ ] Liste conversations
- [ ] Écran chat temps réel
- [ ] Profil utilisateur
- [ ] Modifier profil
- [ ] Paramètres

### Phase 8 — Firebase réel
- [ ] Security Rules Firestore
- [ ] Security Rules Storage
- [ ] Cloud Functions paiement
- [ ] Cloud Functions notifications

---

## 📌 Rappel — Comment travailler efficacement

Au début de chaque session : **"Lis CLAUDE.md. On en est à Phase X — fichier Y."**

Pour chaque fichier : un seul fichier à la fois. Attends que ça marche avant de passer au suivant.
