/**
 * config-manager.js
 * Read and write scripts/weapon-generator/config.json.
 * Exposes helpers for the interactive "Edit stat ranges" and
 * "Configure GitHub repository" menu items.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');

/** Load config from disk. Throws if malformed. */
function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

/** Write config to disk with 2-space pretty-print. */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Interactively edit GitHub settings via inquirer.
 * @param {object} inquirer - the inquirer instance
 * @returns {Promise<void>}
 */
async function editGithubConfig(inquirer) {
  const report = require('./reporter');
  const config = loadConfig();
  const g      = config.github;

  report.header('Configure GitHub Repository');

  const answers = await inquirer.prompt([
    {
      type:    'input',
      name:    'username',
      message: 'GitHub username or organisation:',
      default: g.username,
    },
    {
      type:    'input',
      name:    'repository',
      message: 'Repository name:',
      default: g.repository,
    },
    {
      type:    'input',
      name:    'branch',
      message: 'Branch:',
      default: g.branch,
    },
    {
      type:    'input',
      name:    'assetsDir',
      message: 'Assets sub-directory (leave blank if weapons/ is at repo root):',
      default: g.assetsDir,
    },
  ]);

  config.github = {
    username:   answers.username.trim(),
    repository: answers.repository.trim(),
    branch:     answers.branch.trim(),
    assetsDir:  answers.assetsDir.trim(),
  };

  saveConfig(config);
  report.added('GitHub configuration saved to config.json.');
}

/**
 * Interactively edit stat ranges for one or all stat/rarity combinations.
 * @param {object} inquirer
 * @returns {Promise<void>}
 */
async function editStatRanges(inquirer) {
  const report = require('./reporter');
  const config = loadConfig();

  report.header('Edit Stat Ranges');
  report.info('Leave a value blank to keep the current setting.');
  report.blank();

  const STATS    = ['atk', 'def', 'hp'];
  const RARITIES = ['common', 'rare', 'epic', 'legendary'];

  // Let the user pick which stat to edit (or all).
  const { chosenStat } = await inquirer.prompt([{
    type:    'list',
    name:    'chosenStat',
    message: 'Which stat category do you want to edit?',
    choices: [
      { name: 'ATK (swords, axes, bows, polearms)', value: 'atk' },
      { name: 'DEF (shields, armor)',               value: 'def' },
      { name: 'HP  (rings, pendants, charms)',      value: 'hp'  },
      { name: 'All of the above',                   value: 'all' },
    ],
  }]);

  const statsToEdit = chosenStat === 'all' ? STATS : [chosenStat];

  for (const stat of statsToEdit) {
    report.subheader(`Stat: ${stat.toUpperCase()}`);
    for (const rarity of RARITIES) {
      const cur = config.statRanges[stat][rarity];
      const { minStr, maxStr } = await inquirer.prompt([
        {
          type:    'input',
          name:    'minStr',
          message: `  ${rarity.padEnd(10)} min (current: ${cur.min}):`,
          default: String(cur.min),
        },
        {
          type:    'input',
          name:    'maxStr',
          message: `  ${rarity.padEnd(10)} max (current: ${cur.max}):`,
          default: String(cur.max),
          validate(v) {
            return Number.isInteger(+v) && +v > 0 ? true : 'Must be a positive integer.';
          },
        },
      ]);
      const min = parseInt(minStr, 10) || cur.min;
      const max = parseInt(maxStr, 10) || cur.max;
      config.statRanges[stat][rarity] = { min: Math.min(min, max), max: Math.max(min, max) };
    }
    report.blank();
  }

  saveConfig(config);
  report.added('Stat ranges saved to config.json.');
}

module.exports = { loadConfig, saveConfig, editGithubConfig, editStatRanges };
