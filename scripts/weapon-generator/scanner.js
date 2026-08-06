/**
 * scanner.js
 * Recursively walks the weapons/ directory and returns all image file paths.
 * Supports .png, .jpg, .jpeg, .webp on all platforms (Windows, Linux, Android/Termux).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/**
 * Recursively collect every image file under a directory.
 * @param {string} dir - absolute path to walk
 * @returns {string[]} absolute paths, sorted for determinism
 */
function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    let stat;
    try { stat = fs.statSync(full); } catch { continue; }

    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (IMAGE_EXTS.has(path.extname(entry).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Scan the weapons/ directory relative to the repository root.
 * @param {string} repoRoot - absolute path to the repo root
 * @returns {string[]} absolute paths to every weapon image found
 */
function scanWeapons(repoRoot) {
  return walk(path.join(repoRoot, 'weapons'));
}

module.exports = { scanWeapons };
