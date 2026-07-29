# Xoul-assets

This repository contains art assets for the Xoul project, organized by weapon rarity and type, icons, UI elements, and a small docs folder with a weapons database.

Repository layout:

- weapons/
  - common/rare/epic/legendary -> swords, axes, bows, polearms, shields, armor, rings, charms, pendants
- icons/
  - weapon_types/, rarity/, stats/
- ui/
  - backgrounds/, frames/, banners/, misc/
- docs/
  - weapon_database.json (starter)

How to add assets:

- Add image files (PNG/WebP/AVIF) to the appropriate folder matching rarity and type, e.g. weapons/epic/swords/odin_blade.png
- Add matching icons in icons/ and reference files in docs/weapon_database.json
- Keep file names lowercase, use underscores for spaces, include type and rarity in filenames when useful.

Example file naming:
- weapons/common/swords/bronze_sabre.png
- icons/weapon_types/sword.png

If you'd like, I can:
- Add a CONTRIBUTING.md with asset naming rules
- Add GitHub Actions to validate image sizes and formats
- Generate an index JSON of all current assets
