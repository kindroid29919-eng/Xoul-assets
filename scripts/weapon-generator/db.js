/**
 * db.js
 * Read and write weapons.json at the repository root.
 * Keeps entries sorted by rarity → weapon type → name.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };

/** Absolute path to weapons.json. */
function dbPath(repoRoot) {
  return path.join(repoRoot, 'weapons.json');
}

/**
 * Load and parse weapons.json.
 * Returns an empty array when the file does not exist yet.
 * @param {string} repoRoot
 * @returns {object[]}
 */
function load(repoRoot) {
  const p = dbPath(repoRoot);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error(`weapons.json is not valid JSON: ${e.message}`);
  }
}

/**
 * Sort entries: rarity first, then weapon type, then name (alphabetical).
 * @param {object[]} entries
 * @returns {object[]}
 */
function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const rd = (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
    if (rd !== 0) return rd;
    if (a.weaponType < b.weaponType) return -1;
    if (a.weaponType > b.weaponType) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Write entries to weapons.json with 2-space indentation.
 * @param {string} repoRoot
 * @param {object[]} entries
 */
function save(repoRoot, entries) {
  const sorted = sortEntries(entries);
  fs.writeFileSync(dbPath(repoRoot), JSON.stringify(sorted, null, 2) + '\n');
}

module.exports = { load, save, sortEntries, dbPath };
