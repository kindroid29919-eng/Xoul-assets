#!/usr/bin/env node
/**
 * index_assets.js
 *
 * Scans the weapons/ folder and syncs docs/weapon_database.json.
 *
 * - Existing entries are preserved (name, rarity, values, and image path unchanged).
 * - New image files get a stub entry with name "NEW" so you can fill them in.
 * - Existing legacy image paths are recognized during the transition to the
 *   category-first layout and are not flagged as missing.
 *
 * Usage:
 *   node scripts/index_assets.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WEAPONS_DIR = path.join(ROOT, "weapons");
const DB_PATH = path.join(ROOT, "docs", "weapon_database.json");

const CATEGORIES = ["atk", "def", "hp"];
const TYPES_BY_CATEGORY = {
  atk: ["swords", "axes", "bows", "polearms"],
  // Defensive and HP assets are intentionally not indexed yet.
  def: [],
  hp: [],
};
const RARITIES = ["common", "rare", "epic", "legendary"];
const IMAGE_EXTS = new Set([".png", ".webp", ".avif", ".jpg", ".jpeg"]);

// ── 1. Scan the filesystem ──────────────────────────────────────────────────

function scanWeapons() {
  const found = []; // { category, rarity, type, file, relPath, legacyRelPath }

  for (const category of CATEGORIES) {
    for (const typeName of TYPES_BY_CATEGORY[category]) {
      for (const rarity of RARITIES) {
        const rarityDir = path.join(WEAPONS_DIR, category, typeName, rarity);
        if (!fs.existsSync(rarityDir)) continue;

        for (const file of fs.readdirSync(rarityDir)) {
          if (file.startsWith(".")) continue;
          const ext = path.extname(file).toLowerCase();
          if (!IMAGE_EXTS.has(ext)) continue;

          found.push({
            category,
            rarity,
            type: typeName,
            file,
            relPath: `weapons/${category}/${typeName}/${rarity}/${file}`,
            // Keep the old path as a compatibility alias until the database
            // paths are intentionally migrated in a separate change.
            legacyRelPath: `weapons/${rarity}/${typeName}/${file}`,
          });
        }
      }
    }
  }

  return found;
}

// ── 2. Load existing database ───────────────────────────────────────────────

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

// ── 3. Assign a unique ID ───────────────────────────────────────────────────

function makeId(rarity, type, existingIds) {
  // Normalise type: strip trailing 's' for singular form in the ID
  const typeSingular = type.replace(/s$/, "");
  const prefix = `${rarity}_${typeSingular}_`;
  let n = 1;
  while (existingIds.has(`${prefix}${String(n).padStart(3, "0")}`)) n++;
  const id = `${prefix}${String(n).padStart(3, "0")}`;
  existingIds.add(id);
  return id;
}

// ── 4. Merge ────────────────────────────────────────────────────────────────

function merge(dbEntries, scanned) {
  // Index existing DB entries by image path
  const byImage = new Map(dbEntries.map((e) => [e.image, e]));
  const existingIds = new Set(dbEntries.map((e) => e.id));

  const result = [];
  const seenImages = new Set();

  // Keep or update entries that have a matching file on disk
  for (const item of scanned) {
    seenImages.add(item.relPath);
    const existingEntry = byImage.get(item.relPath);
    const legacyEntry = byImage.get(item.legacyRelPath);
    if (existingEntry || legacyEntry) {
      // Preserve existing entry; remove any stale "missing" flag
      const entry = { ...(existingEntry || legacyEntry) };
      delete entry.missing;
      // The database path is intentionally preserved until its separate
      // migration. This alias keeps the indexer from reporting it as missing.
      seenImages.add(entry.image);
      result.push(entry);
    } else {
      // New file — create a stub
      const id = makeId(item.rarity, item.type, existingIds);
      result.push({
        id,
        name: "NEW",
        rarity: item.rarity,
        weaponType: item.type.replace(/s$/, ""), // singular
        baseStat: item.category,
        baseStatValue: 0,
        image: item.relPath,
      });
      console.log(`  + Added stub for: ${item.relPath}  (id: ${id})`);
    }
  }

  // Flag entries whose files no longer exist
  for (const entry of dbEntries) {
    if (!seenImages.has(entry.image)) {
      console.warn(`  ! Missing file for entry "${entry.id}": ${entry.image}`);
      result.push({ ...entry, missing: true });
    }
  }

  // Sort: rarity order, then weapon type, then id
  const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
  result.sort((a, b) => {
    const rd = (rarityOrder[a.rarity] ?? 9) - (rarityOrder[b.rarity] ?? 9);
    if (rd !== 0) return rd;
    if (a.weaponType < b.weaponType) return -1;
    if (a.weaponType > b.weaponType) return 1;
    return a.id.localeCompare(b.id);
  });

  return result;
}

// ── 5. Main ─────────────────────────────────────────────────────────────────

function main() {
  console.log("Scanning weapons/...");
  const scanned = scanWeapons();
  console.log(`  Found ${scanned.length} image file(s).`);

  const db = loadDB();
  console.log(`  Loaded ${db.length} existing DB entries.`);

  const merged = merge(db, scanned);

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2) + "\n");

  const stubs = merged.filter((e) => e.name === "NEW").length;
  const missing = merged.filter((e) => e.missing).length;

  console.log(`\nDone. weapon_database.json updated (${merged.length} entries).`);
  if (stubs > 0)
    console.log(`  → ${stubs} stub(s) need a name and baseStatValue filled in.`);
  if (missing > 0)
    console.log(`  → ${missing} entr${missing === 1 ? "y" : "ies"} flagged as missing (image file not found).`);
}

main();
