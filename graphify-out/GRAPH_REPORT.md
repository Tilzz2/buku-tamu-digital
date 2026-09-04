# Graph Report - .  (2026-09-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 93 nodes · 127 edges · 13 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- db.ts
- package.json
- paths
- dependencies
- seed.mjs
- auth.ts
- notifications.ts

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 18 edges
2. `queryOne()` - 9 edges
3. `queryAll()` - 9 edges
4. `runSql()` - 7 edges
5. `scripts` - 6 edges
6. `createNotification()` - 6 edges
7. `POST()` - 5 edges
8. `parseSessionToken()` - 4 edges
9. `checkEscalations()` - 4 edges
10. `paths` - 4 edges

## Surprising Connections (you probably didn't know these)
- `verifyAdmin()` --calls--> `getDb()`  [EXTRACTED]
  src/lib/auth.ts → src/lib/db.ts
- `parseSessionToken()` --calls--> `getDb()`  [EXTRACTED]
  src/lib/auth.ts → src/lib/db.ts
- `createNotification()` --calls--> `getDb()`  [EXTRACTED]
  src/lib/notifications.ts → src/lib/db.ts
- `POST()` --calls--> `getDb()`  [EXTRACTED]
  src/pages/api/checkin.ts → src/lib/db.ts
- `GET()` --calls--> `getDb()`  [EXTRACTED]
  src/pages/api/qr-lookup.ts → src/lib/db.ts

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.18
Nodes (14): DB_DIR, DB_PATH, __dirname, getDb(), MIGRATIONS_DIR, PROJECT_ROOT, queryAll(), runMigrations() (+6 more)

### Community 1 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, @types/bcryptjs, name, private, scripts, build, db:seed, dev (+5 more)

### Community 2 - "paths"
Cohesion: 0.17
Nodes (11): astro/tsconfigs/strict, src/components/*, src/layouts/*, src/lib/*, compilerOptions, baseUrl, paths, extends (+3 more)

### Community 3 - "dependencies"
Cohesion: 0.18
Nodes (11): astro, @astrojs/node, bcryptjs, dependencies, astro, @astrojs/node, bcryptjs, sql.js (+3 more)

### Community 4 - "seed.mjs"
Cohesion: 0.18
Nodes (10): adminHash, categories, data, DB_DIR, DB_PATH, __dirname, migrationFiles, MIGRATIONS_DIR (+2 more)

### Community 5 - "auth.ts"
Cohesion: 0.29
Nodes (5): getAdminFromRequest(), parseSessionToken(), verifyAdmin(), queryOne(), GET()

### Community 6 - "notifications.ts"
Cohesion: 0.39
Nodes (5): runSql(), createNotification(), notifyStaff(), staffConnections, POST()

## Knowledge Gaps
- **39 isolated node(s):** `name`, `type`, `version`, `private`, `dev` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getDb()` connect `db.ts` to `auth.ts`, `notifications.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._