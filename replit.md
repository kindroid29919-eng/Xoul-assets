# Xoul Assets

Art asset repository for the Xoul project — weapons, icons, and UI elements organized by rarity and type.

## Project structure

```
weapons/
  common / rare / epic / legendary
    swords / axes / bows / polearms / shields / armor / rings / charms / pendants
icons/
  weapon_types/   rarity/   stats/
ui/
  backgrounds/   frames/   banners/   misc/
docs/
  weapon_database.json   ← master index of all weapons
scripts/
  index_assets.js        ← auto-syncs weapon_database.json from folder contents
```

## How to add a weapon asset

1. Drop the PNG/WebP/AVIF into the correct folder, e.g.  
   `weapons/epic/axes/storm_cleaver.png`
2. Follow the naming convention: lowercase, underscores, include rarity/type hints when useful.
3. Run the indexer to update `docs/weapon_database.json`:  
   ```
   node scripts/index_assets.js
   ```
4. Open `docs/weapon_database.json` and fill in the `name`, `stat`, and `base_stat` for any `"NEW"` entries the script added.

## Naming convention

| Field       | Convention                                      |
|-------------|--------------------------------------------------|
| File name   | `lowercase_with_underscores.png`                |
| ID          | `{rarity}_{type}_{NNN}` — auto-assigned by script |
| `stat`      | `atk` / `def` / `spd` / `hp` etc.              |
| `base_stat` | integer — scale roughly: common 1–5, rare 5–9, epic 9–13, legendary 13+ |

## Supported rarities & types

**Rarities:** common, rare, epic, legendary  
**Types:** swords, axes, bows, polearms, shields, armor, rings, charms, pendants

## User preferences

- Keep the existing folder structure and naming conventions.
