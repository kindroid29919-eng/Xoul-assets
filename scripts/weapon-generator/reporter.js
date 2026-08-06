/**
 * reporter.js
 * Colored console output helpers built on chalk@4 (CJS-compatible).
 * Works on Windows, Linux, and Android/Termux.
 */

'use strict';

const chalk = require('chalk');

const r = {
  /** ── Section headings ───────────────────────────────────────────────── */
  header(msg) { console.log('\n' + chalk.bold.cyan('══ ' + msg + ' ══')); },
  subheader(msg) { console.log(chalk.bold.white('   ' + msg)); },

  /** ── Single-line statuses ───────────────────────────────────────────── */
  added(msg)   { console.log(chalk.green(  '  ✔ ' + msg)); },
  skipped(msg) { console.log(chalk.yellow( '  ↷ ' + msg)); },
  warn(msg)    { console.log(chalk.yellow( '  ⚠ ' + msg)); },
  error(msg)   { console.log(chalk.red(    '  ✖ ' + msg)); },
  info(msg)    { console.log(chalk.dim(    '  · ' + msg)); },
  bold(msg)    { console.log(chalk.bold(msg)); },
  blank()      { console.log(); },

  /** ── Divider ─────────────────────────────────────────────────────────── */
  divider() { console.log(chalk.dim('  ' + '─'.repeat(54))); },

  /** ── End-of-run summary ──────────────────────────────────────────────── */
  summary({ added, skipped, duplicates, invalid }) {
    r.blank();
    console.log(chalk.bold('  ─── Summary ' + '─'.repeat(42)));
    console.log(`  ${chalk.green(String(added).padStart(4))}  weapon(s) added`);
    console.log(`  ${chalk.yellow(String(skipped).padStart(4))}  weapon(s) skipped (already in weapons.json)`);
    if (duplicates > 0) console.log(`  ${chalk.red(String(duplicates).padStart(4))}  duplicate file ID(s) on disk`);
    if (invalid   > 0) console.log(`  ${chalk.red(String(invalid).padStart(4))}  file(s) skipped (bad folder structure)`);
    r.blank();
  },

  /** ── Banner shown at start ───────────────────────────────────────────── */
  banner() {
    r.blank();
    console.log(chalk.bold.magenta('  ╔══════════════════════════════════╗'));
    console.log(chalk.bold.magenta('  ║       Weapon Generator  ⚔        ║'));
    console.log(chalk.bold.magenta('  ╚══════════════════════════════════╝'));
    r.blank();
  },
};

module.exports = r;
