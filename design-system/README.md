# Medusa Design System

Platform-agnostic design tokens, plus generated bindings for **web (CSS + TypeScript)** and
**Flutter (Dart)**. One source of truth, so the Kratos self-service UI and the Flutter app
can't drift apart.

```
design-system/
├── tokens/                  ← the source of truth (hand-edited)
│   ├── color.json             every colour, with dark + light values
│   ├── typography.json        families, weights, sizes, tracking, line-heights
│   ├── layout.json            spacing, radii, sizes, borders, shadows, breakpoints
│   ├── motion.json            durations, easings, stagger
│   └── icons.json             the shared stroke icon set, as drawing primitives
├── build/
│   └── build.mjs            ← generator (no dependencies, plain Node ≥ 16)
└── dist/                    ← generated, never hand-edited
    ├── css/tokens.css         CSS custom properties (dark default, light override)
    ├── react/tokens.ts        typed TS object + cssVar() helper
    └── flutter/
        ├── medusa_tokens.dart   Color/size/duration constants
        ├── medusa_theme.dart    ready-made light & dark ThemeData
        └── medusa_icons.dart    the icon set as Path/Circle/Rect primitives
```

## Regenerating

```bash
npm run tokens
```

It also runs automatically before `npm run dev` and `npm run build`, so `dist/` is never stale.

## Token format

Tokens follow the [W3C Design Tokens](https://design-tokens.github.io/community-group/format/)
shape (`$type` / `$value` / `$description`), with one deliberate extension: a `$value` may be an
object of `{ "dark": …, "light": … }`. The build emits those as themed CSS variables, as two TS
objects, and as two Dart colour classes.

Dimensions are stored as **unitless numbers in px**, so Flutter can use them directly as
logical pixels while the CSS build appends `px`. Durations are stored in **ms** for the same
reason (`Duration(milliseconds:)`).

## Using it

**Web (CSS)** — the variables are global; use them as you already do:

```css
.thing { color: var(--fg-0); border-radius: var(--r-md); }
```

Both the short aliases (`--fg-0`, `--r-md`, `--accent-hi`) and the fully-qualified names
(`--color-fg-0`, `--radius-md`, `--color-accent-hi`) are emitted, so existing stylesheets keep
working while new code can use the explicit names.

**Web (TS)** — for values you need in JS (chart colours, canvas, inline styles):

```ts
import { tokens, cssVar, darkTheme } from "@/design-system/dist/react/tokens"

tokens.motionDurationNormal   // 280
cssVar("accent-hi")           // "var(--accent-hi)"  ← still theme-reactive
darkTheme.colorAccentHi       // "#2d6a4f"           ← frozen value
```

Prefer `cssVar()` over the frozen values in components — it keeps live theme switching working.

**Flutter**:

```dart
import 'package:medusa_design_system/medusa_theme.dart';

MaterialApp(
  theme: MedusaTheme.light,
  darkTheme: MedusaTheme.dark,
  themeMode: ThemeMode.system,
);
```

## Extracting to its own repo

This folder is self-contained by design — nothing in it imports from the app.

1. `git subtree split --prefix=design-system -b design-system` (keeps history), then push that
   branch to the new repo. Or simply copy the folder.
2. Add a `package.json` to the new repo:
   ```json
   { "name": "@medusa/design-system", "version": "0.1.0",
     "files": ["tokens", "dist"],
     "exports": { "./tokens.css": "./dist/css/tokens.css", "./tokens": "./dist/react/tokens.ts" },
     "scripts": { "build": "node build/build.mjs", "prepublishOnly": "npm run build" } }
   ```
3. For Flutter, publish `dist/flutter/` as a package (`pubspec.yaml` with `flutter` as a
   dependency), or consume it via a git dependency:
   ```yaml
   dependencies:
     medusa_design_system:
       git: { url: git@github.com:you/medusa-design-system.git, path: dist/flutter }
   ```
4. Back in this app, replace the two references:
   - `styles/globals.css` → `@import "@medusa/design-system/tokens.css";`
   - `package.json` → drop the `tokens` / `predev` / `prebuild` scripts, add the dependency.

That's the whole coupling — two lines.

## Adding a token

1. Add it to the right file under `tokens/`.
2. `npm run tokens`.
3. If the app's stylesheet should get a short alias (e.g. `--fg-0`), add it to `CSS_ALIASES` in
   `build/build.mjs`.

Never edit anything in `dist/` — it's overwritten on every build.
