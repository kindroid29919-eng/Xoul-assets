/**
 * validator.js
 * Stand-alone asset validation (CLI --validate flag or menu option 5).
 * Reports: invalid folder structures, duplicate IDs on disk, missing image files.
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const { parsePath }   = require('./generator');
const { scanWeapons } = require('./scanner');
const report          = require('./reporter');
const { load, dbPath } = require('./db');

/**
 * Validate all weapon assets and cross-check against weapons.json.
 * @param {string} repoRoot - absolute path to the repository root
 */
function validateAssets(repoRoot) {
  report.header('Asset Validation');

  // ── 1. Scan the filesystem ──────────────────────────────────────────────
  const files = scanWeapons(repoRoot);
  report.info(`Found ${files.length} image file(s) under weapons/`);
  report.blank();

  let validCount   = 0;
  let invalidCount = 0;
  const idMap      = new Map(); // id → relativePath (first seen)
  const duplicates = [];

  for (const file of files) {
    const parsed = parsePath(file, repoRoot);
    if (!parsed.ok) {
      report.error(parsed.error);
      invalidCount++;
    } else {
      validCount++;
      if (idMap.has(parsed.id)) {
        duplicates.push({ id: parsed.id, path: parsed.relativePath });
        report.warn(`Duplicate ID "${parsed.id}" — conflicts with: ${idMap.get(parsed.id)}`);
        report.warn(`  → this file:     ${parsed.relativePath}`);
      } else {
        idMap.set(parsed.id, parsed.relativePath);
      }
    }
  }

  // ── 2. Cross-check weapons.json entries ────────────────────────────────
  let missingImages = 0;
  const dbFile = dbPath(repoRoot);
  if (fs.existsSync(dbFile)) {
    let db;
    try { db = load(repoRoot); } catch (e) { report.error(`Could not read weapons.json: ${e.message}`); db = []; }

    report.blank();
    report.info(`Checking ${db.length} entries in weapons.json for missing images…`);

    for (const entry of db) {
      // Derive local path from the image URL (strip GitHub raw prefix) or from id.
      let found = false;
      if (entry.image) {
        // Raw URL → relative path: everything after the 4th slash (user/repo/branch/…)
        const urlPath = entry.image.replace(/^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\//, '');
        if (fs.existsSync(path.join(repoRoot, urlPath))) found = true;
      }
      if (!found) {
        report.warn(`weapons.json entry "${entry.id}" has no matching image on disk`);
        missingImages++;
      }
    }
  } else {
    report.info('weapons.json does not exist yet — skipping cross-check.');
  }

  // ── 3. Results ─────────────────────────────────────────────────────────
  report.blank();
  report.divider();
  console.log(`  Valid images   : ${validCount}`);
  console.log(`  Invalid paths  : ${invalidCount}`);
  console.log(`  Duplicate IDs  : ${duplicates.length}`);
  console.log(`  Missing images : ${missingImages}`);
  report.divider();
  report.blank();

  if (invalidCount === 0 && duplicates.length === 0 && missingImages === 0) {
    report.added('All assets are valid!');
  } else {
    report.error('Issues found — review the items above.');
  }
}

module.exports = { validateAssets };
