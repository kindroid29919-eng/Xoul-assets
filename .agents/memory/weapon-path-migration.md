---
name: Weapon metadata inclusion
description: Weapon asset paths and metadata are updated in separate user-approved steps.
---

The database uses the category-first weapon paths and the camelCase entry schema (`weaponType`, `baseStat`, and `baseStatValue`). It contains only user-approved weapon types; newly uploaded defensive or HP assets are not added automatically.

**Why:** The repository owner explicitly requested that existing weapons be updated first and that uploaded shields remain out of the database until separately approved.

**How to apply:** Preserve the exact schema and do not add new asset categories or entries unless the user requests their inclusion.