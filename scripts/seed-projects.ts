/**
 * Seed script – importiert alle Projekte aus der Ordnerliste in Firestore
 *
 * Einmalig ausführen:
 *   cd /Volumes/Tomoro/App/Bilder/buildsnap
 *   npm install firebase-admin
 *   npx ts-node --project tsconfig.node.json scripts/seed-projects.ts
 *
 * Service-Account: Firebase Console → Projekteinstellungen → Dienstkonten
 *   → "Neuen privaten Schlüssel generieren" → als scripts/serviceAccount.json speichern
 */

import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

const serviceAccountPath = path.join(__dirname, "serviceAccount.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌  scripts/serviceAccount.json nicht gefunden.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
  ),
});

const db = admin.firestore();

// ── Projektliste aus Ordnerstruktur ──────────────────────────
// Format: projectNumber, name (Projektbezeichnung), location (Ort)

const PROJECTS = [
  // ── 2023 ──
  { projectNumber: "2023-05", name: "Passerelle, Lift, Bahnhof", location: "Horgen" },
  { projectNumber: "2023-48", name: "Pilatus Arena Fassadensockel", location: "Kriens" },

  // ── 2024 ──
  { projectNumber: "2024-16", name: "Kanal Manessestrasse", location: "Zürich" },
  { projectNumber: "2024-19", name: "NB Formenbau Werkareal Fanger", location: "Giswil" },
  { projectNumber: "2024-29", name: "Areal Rosental ELT", location: "Basel" },
  { projectNumber: "2024-31", name: "Fleur de la Champagne", location: "Biel" },
  { projectNumber: "2024-44", name: "SBB DU Glarnerland", location: "Glarus" },

  // ── 2025 ──
  { projectNumber: "2025-02", name: "Schüssbrücke", location: "Biel" },
  { projectNumber: "2025-07", name: "PU", location: "Herisau" },
  { projectNumber: "2025-12", name: "Pilatus Flugzeugwerk", location: "Stans" },
  { projectNumber: "2025-17", name: "DU Uitikon Waldegg", location: "Uitikon" },
  { projectNumber: "2025-20", name: "LUKS", location: "Wolhusen" },
  { projectNumber: "2025-24", name: "Hüribach-Brücke", location: "Muotathal" },
  { projectNumber: "2025-27", name: "Träger Sagenmatt", location: "Ebikon" },
  { projectNumber: "2025-28", name: "Polyfeld", location: "Muttenz" },
  { projectNumber: "2025-37", name: "BD Haagberg Lochbach", location: "Selzach" },
  { projectNumber: "2025-45", name: "Aarhaldenstrasse 17", location: "Zollikofen" },
  { projectNumber: "2025-47", name: "BTG Palézieux 9M", location: "Palézieux" },
  { projectNumber: "2025-48", name: "BTG Tüscherz 8M", location: "Tüscherz" },
  { projectNumber: "2025-49", name: "BTG Estavayer 9M", location: "Estavayer" },
  { projectNumber: "2025-52", name: "Braitunnel I RHB", location: "Zernetz" },
  { projectNumber: "2025-54", name: "Sihlsteg", location: "Langnau a. A." },
  { projectNumber: "2025-57", name: "Schotterträgerbrücke", location: "Davos-Laret" },
  { projectNumber: "2025-58", name: "Industriestrasse G11", location: "Luzern" },
  { projectNumber: "2025-59", name: "Vorversuch Schutzgalerie", location: "Mitholz" },
  { projectNumber: "2025-60", name: "STM KM 1.609 - 1.545", location: "" },
  { projectNumber: "2025-61", name: "STM KM 38 - 39", location: "" },
  { projectNumber: "2025-62", name: "LSW Äbi KM 39.20", location: "" },
  { projectNumber: "2025-63", name: "Fischpassage Aarewerke", location: "Thun" },
  { projectNumber: "2025-64", name: "Flughafen Zürich 25-26", location: "Zürich" },
  { projectNumber: "2025-65", name: "Lehnenbrücke Bellevue", location: "Sigriswil" },
  { projectNumber: "2025-66", name: "Gefahrenstellen Tunnel F3", location: "" },
  { projectNumber: "2025-67", name: "OSH Berghalden", location: "Horgen" },
  { projectNumber: "2025-68", name: "Statthalterstrasse 35", location: "Bern" },
  { projectNumber: "2025-69", name: "Sprengstoff Péry", location: "Péry" },
  { projectNumber: "2025-70", name: "PU Luterbach", location: "Luterbach" },

  // ── 2026 ──
  { projectNumber: "2026-01", name: "Reusszopf", location: "Luzern" },
  { projectNumber: "2026-02", name: "Hausen am Albis", location: "Hausen am Albis" },
  { projectNumber: "2026-03", name: "PU Zuoz", location: "Zuoz" },
  { projectNumber: "2026-04", name: "TK B STI E-Mobilität", location: "Thun" },
  { projectNumber: "2026-05", name: "TK B VBB", location: "Biel" },
  { projectNumber: "2026-06", name: "US Muttli", location: "Müntschemier" },
  { projectNumber: "2026-07", name: "VDA Pumpenschacht Flughafen", location: "Zürich" },
  { projectNumber: "2026-08", name: "Hst", location: "Zollikon" },
  { projectNumber: "2026-09", name: "BD Eschlisbach", location: "Güttingen" },
  { projectNumber: "2026-10", name: "DL Küntwilerstrasse", location: "Rotkreuz" },
  { projectNumber: "2026-11", name: "Leewasserbrücke", location: "Brunnen" },
  { projectNumber: "2026-12", name: "Chedi", location: "Andermatt" },
  { projectNumber: "2026-13", name: "PU Seewis", location: "Seewis" },
  { projectNumber: "2026-14", name: "PI Gare les Bois", location: "Les Bois" },
  { projectNumber: "2026-15", name: "Überdeckung Ostring", location: "Regensdorf" },
  { projectNumber: "2026-16", name: "Wynabrücke", location: "Oberkulm" },
  { projectNumber: "2026-17", name: "FRMCS-Linie 290", location: "Bern-Thun" },
  { projectNumber: "2026-18", name: "Artherstrasse", location: "Oberwil" },
  { projectNumber: "2026-19", name: "BTG Wallisellen M10", location: "Wallisellen" },
  { projectNumber: "2026-20", name: "Winznau Sanierung Stauwehr", location: "Winznau" },
  { projectNumber: "2026-21", name: "Sanierung Lindenweg", location: "Bätterkinden" },
  { projectNumber: "2026-22", name: "Ausbau KH3 KH4", location: "Buochs" },
  { projectNumber: "2026-23", name: "BD Runsenbach", location: "Ziegelbrücke" },
  { projectNumber: "2026-25", name: "Fahrbahnübergang Stützmauer", location: "Surava" },
  { projectNumber: "2026-26", name: "SBB Ersatz Richstrasse", location: "Muri AG" },
  { projectNumber: "2026-27", name: "Quartierpark Areal", location: "Zürich" },
  { projectNumber: "2026-28", name: "BTG Tavannes M7", location: "Tavannes" },
  { projectNumber: "2026-29", name: "Leitmauer", location: "Spiez" },
];

async function seed() {
  console.log(`\n🌱  Seed startet – ${PROJECTS.length} Projekte werden importiert...\n`);

  let created = 0;
  let skipped = 0;

  for (const project of PROJECTS) {
    const dup = await db.collection("projects")
      .where("projectNumber", "==", project.projectNumber)
      .limit(1)
      .get();

    if (!dup.empty) {
      console.log(`  ⏭️   ${project.projectNumber} – ${project.name} (bereits vorhanden)`);
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

    console.log(`  ✅  ${project.projectNumber} – ${project.name} (${project.location || "–"})`);
    created++;
  }

  console.log(`\n🎉  Fertig! ${created} Projekte erstellt, ${skipped} übersprungen.\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Fehler:", err);
  process.exit(1);
});
