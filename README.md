# Xoul-assets

This repository contains art assets for the Xoul project, organized by weapon stat category, type, and rarity, plus icons, UI elements, and a small docs folder with a weapons database.

Repository layout:

- weapons/
  - atk/
    - swords/axes/bows/polearms/
      - common/rare/epic/legendary/
  - def/
    - armor/shields/
      - common/rare/epic/legendary/
  - hp/
    - charms/pendants/rings/
      - common/rare/epic/legendary/
- icons/
  - weapon_types/, rarity/, stats/
- ui/
  - backgrounds/, frames/, banners/, misc/
- docs/
  - weapon_database.json (starter)

How to add assets:

- Add image files (PNG/WebP/AVIF) to the appropriate stat, type, and rarity folder, e.g. `weapons/atk/swords/epic/odin_blade.png`
- Add matching icons in icons/ and reference files in docs/weapon_database.json
- Keep file names lowercase, use underscores for spaces, include type and rarity in filenames when useful.

The weapon database currently contains only the existing attack weapons.
Defensive and HP assets, including shields, should be added separately when
they are approved for inclusion.

Example file naming:
- weapons/atk/swords/common/bronze_sabre.png
- icons/weapon_types/sword.png

If you'd like, I can:
- Add a CONTRIBUTING.md with asset naming rules
- Add GitHub Actions to validate image sizes and formats
- Generate an index JSON of all current assets
