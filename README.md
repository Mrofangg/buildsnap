# 📸 BuildSnap — Baudokumentation

> Mobile-first PWA für die Fotodokumentation von Bauprojekten.
> Einfacher als WhatsApp. Sicherer als E-Mail.

---

## ✨ Features

| Feature | Wer |
|---|---|
| Projekte erstellen & verwalten | Admin |
| Fotos hochladen (Kamera + Galerie) | Admin, Mitarbeiter |
| Timeline-Ansicht pro Projekt | Admin, Mitarbeiter, Marketing |
| Externe Upload-Links generieren | Admin |
| Fotos hochladen ohne Login | Externe (via Link) |
| Alle Fotos filtern, favorisieren, herunterladen | Marketing |
| Als App installierbar (PWA) | Alle |

---

## 🚀 Schnellstart

### 1. Firebase-Projekt erstellen

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. **Neues Projekt** erstellen (z.B. `buildsnap-prod`)
3. Folgende Dienste aktivieren:
   - **Authentication** → Sign-in method → **Email/Password** aktivieren
   - **Firestore Database** → Im Produktionsmodus erstellen, Region: `europe-west3`
   - **Storage** → Standardeinstellungen, Region: `europe-west3`

### 2. Firebase-Konfiguration holen

Firebase Console → Projekteinstellungen (⚙️) → **Allgemein** → *Deine Apps* → `</>`-Icon → Web-App registrieren

Werte kopieren für den nächsten Schritt.

### 3. Projekt einrichten

```bash
# Repository klonen oder Dateien entpacken
cd buildsnap

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.local.example .env.local
# → .env.local öffnen und Firebase-Werte eintragen
```

### 4. `.env.local` befüllen

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mein-projekt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mein-projekt
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mein-projekt.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Sicherheitsregeln deployen

```bash
# Firebase CLI installieren (einmalig)
npm install -g firebase-tools

# Einloggen
firebase login

# Projekt verknüpfen
firebase use --add
# → dein Projekt auswählen, Alias "default" eingeben

# Firestore-Regeln & Indexes deployen
firebase deploy --only firestore

# Storage-Regeln deployen
firebase deploy --only storage
```

### 6. Demo-Benutzer anlegen

```bash
# Service Account Key herunterladen:
# Firebase Console → Projekteinstellungen → Dienstkonten → Neuen privaten Schlüssel generieren
# → Datei speichern als: scripts/serviceAccountKey.json

npm install -g firebase-admin
node scripts/firebase-setup.js
```

**Demo-Zugangsdaten nach Setup:**

| Rolle | E-Mail | Passwort |
|---|---|---|
| Admin | admin@buildsnap.de | BuildSnap2024! |
| Mitarbeiter | mitarbeiter@buildsnap.de | BuildSnap2024! |
| Marketing | marketing@buildsnap.de | BuildSnap2024! |

### 7. Lokal starten

```bash
npm run dev
# → http://localhost:3000
```

---

## 🌐 Deployment (Vercel — empfohlen)

```bash
# Vercel CLI installieren
npm install -g vercel

# Deployen
vercel

# Umgebungsvariablen in Vercel setzen:
# vercel.com → Projekt → Settings → Environment Variables
# Alle NEXT_PUBLIC_FIREBASE_* Werte eintragen
# NEXT_PUBLIC_APP_URL=https://deine-domain.vercel.app
```

### Alternativ: Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## 📱 Als PWA installieren (iOS/Android)

**iPhone/iPad:**
1. App in Safari öffnen
2. Teilen-Symbol → **Zum Home-Bildschirm hinzufügen**

**Android:**
1. App in Chrome öffnen
2. Menü (⋮) → **App installieren**

---

## 🗂️ Projektstruktur

```
buildsnap/
├── src/
│   ├── app/
│   │   ├── login/          # Login-Seite
│   │   ├── projects/       # Projektliste + Detail
│   │   ├── marketing/      # Marketing-Übersicht
│   │   └── upload/[id]/[token]/  # Externer Upload (kein Login)
│   ├── components/
│   │   ├── layout/         # AppShell, Navigation
│   │   └── ui/             # Button, Modal, ImageUploader, Toast...
│   ├── lib/
│   │   ├── firebase.ts     # Firebase-Initialisierung
│   │   ├── auth-context.tsx # Auth-Zustand
│   │   ├── db.ts           # Firestore + Storage Funktionen
│   │   └── utils.ts        # Hilfsfunktionen
│   └── types/              # TypeScript-Typen
├── firestore.rules         # Sicherheitsregeln Firestore
├── storage.rules           # Sicherheitsregeln Storage
├── firestore.indexes.json  # Composite Indexes
└── scripts/
    └── firebase-setup.js   # Erstellt Demo-Benutzer
```

---

## 🔐 Berechtigungen

| Aktion | Admin | Mitarbeiter | Marketing | Extern |
|---|:---:|:---:|:---:|:---:|
| Projekte erstellen | ✅ | ❌ | ❌ | ❌ |
| Projekte ansehen | ✅ | ✅ | ✅ | ❌ |
| Fotos hochladen | ✅ | ✅ | ❌ | ✅ (via Link) |
| Fotos ansehen | ✅ | ✅ | ✅ | ❌ |
| Favoriten markieren | ✅ | ❌ | ✅ | ❌ |
| Fotos löschen | ✅ | ❌ | ❌ | ❌ |
| Upload-Links erstellen | ✅ | ❌ | ❌ | ❌ |
| Download/Export | ✅ | ❌ | ✅ | ❌ |

---

## 🧱 Datenmodell (Firestore)

### `projects/{id}`
```json
{
  "name": "Einfamilienhaus Musterstr. 12",
  "phase": "Rohbau",
  "createdBy": "uid123",
  "createdByName": "Max Admin",
  "createdAt": "Timestamp",
  "coverImageUrl": "https://...",
  "imageCount": 42,
  "active": true
}
```

### `images/{id}`
```json
{
  "projectId": "proj123",
  "url": "https://firebasestorage...",
  "storagePath": "projects/proj123/uuid.jpg",
  "uploadedBy": "uid123",
  "uploadedByName": "Anna Müller",
  "uploadedAt": "Timestamp",
  "isFavorite": false,
  "fileName": "IMG_001.jpg",
  "fileSize": 1048576,
  "isExternal": false,
  "externalUploaderName": null
}
```

### `uploadLinks/{id}`
```json
{
  "token": "a3f8c2...",
  "projectId": "proj123",
  "projectName": "Einfamilienhaus Musterstr. 12",
  "active": true,
  "createdBy": "uid123",
  "createdAt": "Timestamp",
  "uploadCount": 7
}
```

### `users/{uid}`
```json
{
  "email": "user@firma.de",
  "displayName": "Max Mustermann",
  "role": "admin",
  "createdAt": "Timestamp"
}
```

---

## 🔧 Neue Benutzer anlegen

Benutzer können nur per Firebase Admin SDK oder direkt in der Firebase Console angelegt werden:

1. Firebase Console → Authentication → Benutzer hinzufügen
2. Firestore → Kollektion `users` → Dokument mit der `uid` des Benutzers anlegen:
```json
{
  "email": "neu@firma.de",
  "displayName": "Max Neu",
  "role": "employee",
  "createdAt": { "serverTimestamp": true }
}
```

Rollen: `admin` | `employee` | `marketing`

---

## ⚡ Performance

- **Bildkomprimierung** vor dem Upload (max. 2MB, max. 2048px) via `browser-image-compression`
- **Lazy Loading** für alle Bilder
- **PWA-Caching** für Offline-Nutzung (next-pwa)
- **Firestore-Pagination** kann bei >500 Fotos pro Projekt ergänzt werden

---

## 🛣️ Roadmap / Erweiterungen

- [ ] Push-Benachrichtigungen bei neuen Uploads
- [ ] ZIP-Download über Cloud Function
- [ ] Benutzer-Verwaltung im Admin-Panel
- [ ] Bauphase direkt am Projekt ändern
- [ ] Kommentare / Beschriftungen pro Foto
- [ ] Native App (React Native / Expo) mit gleicher Firebase-Basis
