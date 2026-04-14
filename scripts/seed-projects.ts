/**
 * Seed script – importiert alle Projekte aus der Ordnerliste in Firestore
 *
 * Ausführen:
 *   npx ts-node --project tsconfig.node.json scripts/seed-projects.ts
 *
 * Voraussetzungen:
 *   - Firebase Admin SDK: npm install firebase-admin
 *   - Service-Account-JSON unter scripts/serviceAccount.json (aus Firebase Console)
 */

import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

// ── Firebase initialisieren ──────────────────────────────────
const serviceAccountPath = path.join(__dirname, "serviceAccount.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌  scripts/serviceAccount.json nicht gefunden.");
  console.error("   Lade es herunter: Firebase Console → Projekteinstellungen → Dienstkonten → Neuen privaten Schlüssel generieren");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Projektliste ─────────────────────────────────────────────
// Format: { projectNumber, name, location }

const PROJECTS = [
  // ── 2023 ──
  { projectNumber: "23001", name: "Renovierung Wohnüberbauung", location: "Winterthur" },
  { projectNumber: "23002", name: "Neubau Mehrfamilienhaus", location: "Zürich" },
  { projectNumber: "23003", name: "Fassadensanierung Bürogebäude", location: "Schaffhausen" },
  { projectNumber: "23004", name: "Umbau Einfamilienhaus", location: "Frauenfeld" },
  { projectNumber: "23005", name: "Neubau Gewerbegebäude", location: "Winterthur" },
  { projectNumber: "23006", name: "Sanierung Schulanlage", location: "Andelfingen" },
  { projectNumber: "23007", name: "Anbau Wohnhaus", location: "Embrach" },
  { projectNumber: "23008", name: "Fassade Industriebau", location: "Bassersdorf" },
  { projectNumber: "23009", name: "Umbau Verwaltungsgebäude", location: "Bülach" },
  { projectNumber: "23010", name: "Neubau Lagerhalle", location: "Glattfelden" },
  { projectNumber: "23011", name: "Renovation Altbau", location: "Zürich" },
  { projectNumber: "23012", name: "Erweiterung Produktionshalle", location: "Kloten" },
  { projectNumber: "23013", name: "Neubau Wohnüberbauung", location: "Uster" },
  { projectNumber: "23014", name: "Fassadenrenovation", location: "Dübendorf" },
  { projectNumber: "23015", name: "Umbau Gewerberaum", location: "Winterthur" },

  // ── 2024 ──
  { projectNumber: "24001", name: "Neubau Mehrfamilienhaus Zentrum", location: "Winterthur" },
  { projectNumber: "24002", name: "Fassadensanierung Wohnblock", location: "Schaffhausen" },
  { projectNumber: "24003", name: "Umbau Bürogebäude", location: "Zürich" },
  { projectNumber: "24004", name: "Anbau Schulgebäude", location: "Frauenfeld" },
  { projectNumber: "24005", name: "Neubau Einfamilienhaus", location: "Elgg" },
  { projectNumber: "24006", name: "Sanierung Wohnüberbauung", location: "Dietikon" },
  { projectNumber: "24007", name: "Fassade Gewerbepark", location: "Winterthur" },
  { projectNumber: "24008", name: "Neubau Betriebsgebäude", location: "Bassersdorf" },
  { projectNumber: "24009", name: "Umbau Mehrfamilienhaus", location: "Bülach" },
  { projectNumber: "24010", name: "Erweiterung Logistikzentrum", location: "Glattbrugg" },
  { projectNumber: "24011", name: "Renovation Geschäftshaus", location: "Zürich" },
  { projectNumber: "24012", name: "Neubau Pflegezentrum", location: "Embrach" },
  { projectNumber: "24013", name: "Fassadenerneuerung Wohnhaus", location: "Kloten" },
  { projectNumber: "24014", name: "Umbau Industriegebäude", location: "Winterthur" },
  { projectNumber: "24015", name: "Neubau Doppeleinfamilienhaus", location: "Andelfingen" },
  { projectNumber: "24016", name: "Sanierung Bürogebäude", location: "Dübendorf" },
  { projectNumber: "24017", name: "Anbau Produktionsstätte", location: "Uster" },

  // ── 2025 ──
  { projectNumber: "25001", name: "Neubau Wohnüberbauung Nord", location: "Winterthur" },
  { projectNumber: "25002", name: "Fassadenrenovation Hochhaus", location: "Zürich" },
  { projectNumber: "25003", name: "Umbau Schulanlage", location: "Schaffhausen" },
  { projectNumber: "25004", name: "Neubau Betriebsgebäude West", location: "Frauenfeld" },
  { projectNumber: "25005", name: "Sanierung Mehrfamilienhaus", location: "Bülach" },
  { projectNumber: "25006", name: "Fassade Verwaltungszentrum", location: "Kloten" },
  { projectNumber: "25007", name: "Umbau Einfamilienhaus Ost", location: "Embrach" },
  { projectNumber: "25008", name: "Neubau Gewerbegebäude", location: "Bassersdorf" },
  { projectNumber: "25009", name: "Erweiterung Schulanlage", location: "Andelfingen" },
  { projectNumber: "25010", name: "Renovation Wohnüberbauung", location: "Dietikon" },
  { projectNumber: "25011", name: "Neubau Logistikhalle", location: "Glattfelden" },
  { projectNumber: "25012", name: "Umbau Bürozentrum", location: "Dübendorf" },
  { projectNumber: "25013", name: "Fassadensanierung Industriebau", location: "Winterthur" },
  { projectNumber: "25014", name: "Neubau Mehrfamilienhaus Süd", location: "Uster" },
  { projectNumber: "25015", name: "Anbau Wohngebäude", location: "Elgg" },
  { projectNumber: "25016", name: "Renovation Geschäftshaus", location: "Zürich" },

  // ── 2026 ──
  { projectNumber: "26001", name: "Neubau Wohnüberbauung Zentrum", location: "Winterthur" },
  { projectNumber: "26002", name: "Fassade Bürogebäude", location: "Zürich" },
  { projectNumber: "26003", name: "Umbau Mehrfamilienhaus West", location: "Schaffhausen" },
  { projectNumber: "26004", name: "Neubau Schulanlage", location: "Frauenfeld" },
  { projectNumber: "26005", name: "Sanierung Gewerbegebäude", location: "Kloten" },
  { projectNumber: "26006", name: "Anbau Produktionshalle", location: "Bassersdorf" },
  { projectNumber: "26007", name: "Neubau Einfamilienhaus Ost", location: "Embrach" },
  { projectNumber: "26008", name: "Umbau Verwaltungsgebäude Süd", location: "Bülach" },
];

// ── Seed-Funktion ────────────────────────────────────────────

async function seed() {
  console.log(`\n🌱  Starte Seed – ${PROJECTS.length} Projekte werden importiert...\n`);

  // Prüfe ob bereits Projekte vorhanden sind
  const existing = await db.collection("projects").where("active", "==", true).limit(1).get();
  if (!existing.empty) {
    console.log("⚠️   Es sind bereits Projekte in der Datenbank vorhanden.");
    console.log("    Fahre trotzdem fort und füge neue hinzu...\n");
  }

  let created = 0;
  let skipped = 0;

  for (const project of PROJECTS) {
    // Duplikate prüfen (anhand Projektnummer)
    const dup = await db.collection("projects")
      .where("projectNumber", "==", project.projectNumber)
      .limit(1)
      .get();

    if (!dup.empty) {
      console.log(`  ⏭️   ${project.projectNumber} – ${project.name} (übersprungen, bereits vorhanden)`);
      skipped++;
      continue;
    }

    await db.collection("projects").add({
      projectNumber: project.projectNumber,
      name: project.name,
      location: project.location,
      description: null,
      createdBy: "seed",
      createdByName: "Seed Script",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      coverImageUrl: null,
      imageCount: 0,
      active: true,
      projectLeaderId: null,
      projectLeaderName: null,
    });

    console.log(`  ✅  ${project.projectNumber} – ${project.name} (${project.location})`);
    created++;
  }

  console.log(`\n🎉  Fertig! ${created} Projekte erstellt, ${skipped} übersprungen.\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Fehler:", err);
  process.exit(1);
});
