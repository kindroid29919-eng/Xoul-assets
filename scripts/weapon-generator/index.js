#!/usr/bin/env node
/**
 * index.js — Weapon Generator CLI
 *
 * Usage:
 *   npm run weapons            — interactive menu
 *   npm run weapons:scan       — scan for new weapons (non-interactive)
 *   npm run weapons:rebuild    — rebuild weapons.json from scratch (non-interactive)
 *   npm run weapons:validate   — validate assets (non-interactive)
 *
 * Supports --scan, --rebuild, --validate flags for scripted use.
 */

'use strict';

const path = require('path');

// ── Resolve the repository root (two levels above this script) ────────────────
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ── Internal modules ──────────────────────────────────────────────────────────
const report                          = require('./reporter');
const { scanWeapons }                 = require('./scanner');
const { parsePath, buildEntry }       = require('./generator');
const { load: loadDB, save: saveDB }  = require('./db');
const { validateAssets }              = require('./validator');
const { loadConfig, editGithubConfig, editStatRanges } = require('./config-manager');

// ─────────────────────────────────────────────────────────────────────────────
// Core operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan for new weapon images and append them to weapons.json.
 * Existing entries (matched by id) are never modified.
 *
 * @param {{ verbose?: boolean }} [opts]
 * @returns {{ added, skipped, duplicates, invalid }}
 */
function runScan(opts = {}) {
  const { verbose = true } = opts;
  const config = loadConfig();

  if (verbose) report.header('Scan for new weapons');

  // Load existing DB entries and build an id → entry lookup.
  let existing;
  try { existing = loadDB(REPO_ROOT); }
  catch (e) { report.error(e.message); process.exit(1); }

  const existingIds = new Set(existing.map(e => e.id));
  if (verbose) report.info(`weapons.json has ${existing.length} existing entry/entries.`);

  // Scan the filesystem.
  const files = scanWeapons(REPO_ROOT);
  if (verbose) report.info(`Found ${files.length} image file(s) on disk.`);
  if (verbose) report.blank();

  const stats     = { added: 0, skipped: 0, duplicates: 0, invalid: 0 };
  const seenIds   = new Set(existingIds); // track ids encountered this run
  const newEntries = [];

  for (const file of files) {
    const parsed = parsePath(file, REPO_ROOT);

    if (!parsed.ok) {
      if (verbose) report.error(parsed.error);
      stats.invalid++;
      continue;
    }

    // Duplicate file ID within this scan pass (two files with the same stem).
    if (seenIds.has(parsed.id) && !existingIds.has(parsed.id)) {
      if (verbose) report.warn(`Duplicate ID on disk, skipping: "${parsed.id}" (${parsed.relativePath})`);
      stats.duplicates++;
      continue;
    }

    // Already in weapons.json — skip.
    if (existingIds.has(parsed.id)) {
      if (verbose) report.skipped(`"${parsed.id}" already in weapons.json`);
      stats.skipped++;
      continue;
    }

    // New weapon — build and queue.
    const entry = buildEntry(parsed, config);
    newEntries.push(entry);
    seenIds.add(parsed.id);
    if (verbose) report.added(`Added: ${entry.id}  (${entry.rarity} ${entry.weaponType}, ${entry.baseStat} ${entry.baseStatValue})`);
    stats.added++;
  }

  // Persist.
  if (newEntries.length > 0) {
    saveDB(REPO_ROOT, [...existing, ...newEntries]);
    if (verbose) report.blank();
    if (verbose) report.added(`weapons.json updated — ${newEntries.length} new entry/entries written.`);
  } else if (verbose) {
    report.blank();
    report.info('No new weapons found — weapons.json is up to date.');
  }

  if (verbose) report.summary(stats);
  return stats;
}

/**
 * Rebuild weapons.json from scratch.
 * All existing entries are discarded and regenerated from the asset folders.
 * NOTE: re-running will assign new random baseStatValues.
 *
 * @param {{ verbose?: boolean }} [opts]
 */
function runRebuild(opts = {}) {
  const { verbose = true } = opts;
  const config = loadConfig();

  if (verbose) report.header('Rebuild weapons.json');
  if (verbose) report.warn('All existing entries will be replaced with freshly generated ones.');
  if (verbose) report.blank();

  const files = scanWeapons(REPO_ROOT);
  if (verbose) report.info(`Found ${files.length} image file(s) on disk.`);
  if (verbose) report.blank();

  const stats     = { added: 0, skipped: 0, duplicates: 0, invalid: 0 };
  const seenIds   = new Set();
  const entries   = [];

  for (const file of files) {
    const parsed = parsePath(file, REPO_ROOT);

    if (!parsed.ok) {
      if (verbose) report.error(parsed.error);
      stats.invalid++;
      continue;
    }
    if (seenIds.has(parsed.id)) {
      if (verbose) report.warn(`Duplicate ID skipped: "${parsed.id}" (${parsed.relativePath})`);
      stats.duplicates++;
      continue;
    }

    const entry = buildEntry(parsed, config);
    entries.push(entry);
    seenIds.add(parsed.id);
    if (verbose) report.added(`${entry.id}  →  ${entry.rarity} ${entry.weaponType}  [${entry.baseStat} ${entry.baseStatValue}]`);
    stats.added++;
  }

  saveDB(REPO_ROOT, entries);
  if (verbose) {
    report.blank();
    report.added(`weapons.json rebuilt — ${entries.length} entries written.`);
    report.summary(stats);
  }
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive menu
// ─────────────────────────────────────────────────────────────────────────────

async function runMenu() {
  // Dynamically require inquirer to keep startup fast even in --flag mode.
  let inquirer;
  try {
    inquirer = require('inquirer');
  } catch {
    console.error('inquirer not found — run: npm install');
    process.exit(1);
  }

  report.banner();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { choice } = await inquirer.prompt([{
      type:    'list',
      name:    'choice',
      message: 'What would you like to do?',
      choices: [
        { name: '1. Scan for new weapons    (append to weapons.json)', value: 'scan'     },
        { name: '2. Rebuild weapons.json    (regenerate all entries)',  value: 'rebuild'  },
        { name: '3. Edit stat ranges',                                  value: 'ranges'   },
        { name: '4. Configure GitHub repository',                       value: 'github'   },
        { name: '5. Validate assets',                                   value: 'validate' },
        { name: '6. Exit',                                              value: 'exit'     },
      ],
      pageSize: 8,
    }]);

    switch (choice) {
      case 'scan':
        runScan({ verbose: true });
        break;

      case 'rebuild': {
        const { confirmed } = await inquirer.prompt([{
          type:    'confirm',
          name:    'confirmed',
          message: 'This will discard all existing baseStatValues and reassign them randomly. Continue?',
          default: false,
        }]);
        if (confirmed) runRebuild({ verbose: true });
        else report.info('Rebuild cancelled.');
        break;
      }

      case 'ranges':
        await editStatRanges(inquirer);
        break;

      case 'github':
        await editGithubConfig(inquirer);
        break;

      case 'validate':
        validateAssets(REPO_ROOT);
        break;

      case 'exit':
        report.blank();
        report.info('Goodbye!');
        report.blank();
        process.exit(0);
    }

    // Brief pause so the user can read output before the menu reappears.
    const { _continue } = await inquirer.prompt([{
      type:    'confirm',
      name:    '_continue',
      message: 'Return to the main menu?',
      default: true,
    }]);
    if (!_continue) {
      report.blank();
      report.info('Goodbye!');
      report.blank();
      process.exit(0);
    }
    report.blank();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--scan')) {
  report.banner();
  runScan({ verbose: true });
} else if (args.includes('--rebuild')) {
  report.banner();
  runRebuild({ verbose: true });
} else if (args.includes('--validate')) {
  report.banner();
  validateAssets(REPO_ROOT);
} else {
  // Interactive menu.
  runMenu().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
