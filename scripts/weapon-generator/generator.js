/**
 * generator.js
 * Derives weapon metadata from a file path and builds a complete weapons.json entry.
 *
 * Expected path structure:
 *   weapons/<baseStat>/<typeFolder>/<rarity>/<filename>
 *
 * Example:
 *   weapons/atk/swords/common/basic_sword.png
 *   → { baseStat: 'atk', weaponType: 'sword', rarity: 'common', id: 'basic_sword', ... }
 */

'use strict';

const path = require('path');

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maps plural folder names → singular weapon type strings. */
const FOLDER_TO_TYPE = {
  swords:   'sword',
  axes:     'axe',
  bows:     'bow',
  polearms: 'polearm',
  shields:  'shield',
  armor:    'armor',
  rings:    'ring',
  pendants: 'pendant',
  charms:   'charm',
};

/** Valid singular weapon types per base-stat category. */
const VALID_TYPES = {
  atk: new Set(['sword', 'polearm', 'bow', 'axe']),
  def: new Set(['shield', 'armor']),
  hp:  new Set(['ring', 'pendant', 'charm']),
};

const VALID_RARITIES  = new Set(['common', 'rare', 'epic', 'legendary']);
const VALID_STATS     = new Set(['atk', 'def', 'hp']);

// ── Name generation ───────────────────────────────────────────────────────────

/**
 * Generate a human-readable weapon name from a filename stem.
 *
 * Rules:
 *  1. Remove the file extension (caller must pass stem without extension).
 *  2. Remove trailing digits (e.g. sword01 → sword).
 *  3. Split on underscores.
 *  4. Capitalise every word.
 *
 * Examples:
 *   hi_sword01        → "Hi Sword"
 *   obsidian_barrier02 → "Obsidian Barrier"
 *   phoenix_shield10  → "Phoenix Shield"
 *
 * @param {string} stem - filename without extension
 * @returns {string}
 */
function generateName(stem) {
  return stem
    .replace(/\d+$/, '')      // strip trailing numbers
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim() || stem;          // fallback to original if result is empty
}

// ── Path parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a weapon image file path into its constituent properties.
 *
 * @param {string} absolutePath - full path to the image file
 * @param {string} repoRoot     - absolute path to the repository root
 * @returns {{ ok: true, id, name, rarity, weaponType, baseStat, relativePath, typeFolder, filename }
 *          | { ok: false, relativePath, error: string }}
 */
function parsePath(absolutePath, repoRoot) {
  // Normalise to forward slashes for cross-platform consistency.
  const rel   = path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
  const parts = rel.split('/');

  // Expected depth: weapons / <baseStat> / <typeFolder> / <rarity> / <filename>
  if (parts.length !== 5 || parts[0] !== 'weapons') {
    return {
      ok: false,
      relativePath: rel,
      error: `Unexpected depth (need weapons/<stat>/<type>/<rarity>/<file>): ${rel}`,
    };
  }

  const [, baseStat, typeFolder, rarity, filename] = parts;
  const stem = path.basename(filename, path.extname(filename));

  if (!VALID_STATS.has(baseStat)) {
    return { ok: false, relativePath: rel, error: `Unknown base-stat folder "${baseStat}": ${rel}` };
  }
  if (!VALID_RARITIES.has(rarity)) {
    return { ok: false, relativePath: rel, error: `Unknown rarity folder "${rarity}": ${rel}` };
  }

  const weaponType = FOLDER_TO_TYPE[typeFolder];
  if (!weaponType) {
    return { ok: false, relativePath: rel, error: `Unknown weapon-type folder "${typeFolder}": ${rel}` };
  }
  if (!VALID_TYPES[baseStat].has(weaponType)) {
    return {
      ok: false,
      relativePath: rel,
      error: `Type "${weaponType}" is not valid under "${baseStat}" (valid: ${[...VALID_TYPES[baseStat]].join(', ')}): ${rel}`,
    };
  }

  return { ok: true, id: stem, name: generateName(stem), rarity, weaponType, baseStat, relativePath: rel, typeFolder, filename };
}

// ── Entry building ────────────────────────────────────────────────────────────

/**
 * Pick a random integer in [min, max] inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Build the GitHub Raw Content URL for a weapon image.
 *
 * @param {{ username, repository, branch, assetsDir }} githubConfig
 * @param {string} relativePath - repo-relative path, e.g. weapons/atk/swords/common/foo.png
 * @returns {string}
 */
function buildImageUrl(githubConfig, relativePath) {
  const { username, repository, branch, assetsDir } = githubConfig;
  const prefix = assetsDir ? assetsDir.replace(/\/$/, '') + '/' : '';
  return `https://raw.githubusercontent.com/${username}/${repository}/${branch}/${prefix}${relativePath}`;
}

/**
 * Compose a complete weapons.json entry from a parsed path + config.
 *
 * @param {{ id, name, rarity, weaponType, baseStat, relativePath }} parsed
 * @param {{ statRanges, github }} config
 * @returns {{ id, name, rarity, weaponType, baseStat, baseStatValue, image }}
 */
function buildEntry(parsed, config) {
  const range = config.statRanges[parsed.baseStat][parsed.rarity];
  return {
    id:            parsed.id,
    name:          parsed.name,
    rarity:        parsed.rarity,
    weaponType:    parsed.weaponType,
    baseStat:      parsed.baseStat,
    baseStatValue: randomInRange(range.min, range.max),
    image:         buildImageUrl(config.github, parsed.relativePath),
  };
}

module.exports = {
  parsePath, buildEntry, generateName,
  buildImageUrl, randomInRange,
  FOLDER_TO_TYPE, VALID_TYPES, VALID_RARITIES, VALID_STATS,
};
