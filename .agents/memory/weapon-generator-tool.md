---
name: Weapon Generator tool
description: Node.js CLI that auto-generates weapons.json from weapon asset folder paths; how it is structured and what to keep consistent.
---

# Weapon Generator

## Location
`scripts/weapon-generator/` — all modules are CJS (`require`).

## Key files
- `index.js` — entry point; interactive menu + `--scan` / `--rebuild` / `--validate` flags
- `generator.js` — `parsePath()` derives id/name/rarity/weaponType/baseStat from path; `buildEntry()` produces a full JSON record
- `scanner.js` — walks `weapons/` recursively; returns absolute paths
- `db.js` — loads/saves `weapons.json` at repo root; sorts by rarity → type → name
- `validator.js` — cross-checks disk files against `weapons.json`; reports missing images
- `config-manager.js` — reads/writes `config.json`; exposes interactive editors for GitHub settings and stat ranges
- `config.json` — stat ranges per baseStat/rarity + GitHub image URL settings

## Output file
`weapons.json` at repo root (not `docs/weapon_database.json`).

## Folder → weaponType mapping (singular)
swords→sword, axes→axe, bows→bow, polearms→polearm, shields→shield, armor→armor, rings→ring, pendants→pendant, charms→charm

## Expected path depth
`weapons/<baseStat>/<typeFolder>/<rarity>/<filename>` — exactly 5 parts.

## Why
Uses chalk@4 and inquirer@8 (both CJS-compatible). Do NOT upgrade to chalk@5+ or inquirer@9+ without converting to ESM.

## How to apply
When adding new weapon types or stat categories, update FOLDER_TO_TYPE and VALID_TYPES in generator.js AND add a new stat block in config.json statRanges.
