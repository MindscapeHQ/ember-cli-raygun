# AGENTS.md — ember-cli-raygun

Guidance for AI agents (and humans) working in this repo. Read this before
making changes.

---

## 1. What this repo is

`ember-cli-raygun` is a **v2 Ember addon** (Embroider/Vite-compatible) that
integrates the [Raygun.com](https://raygun.com) crash-reporting and Pulse
RUM service into an Ember application by wrapping the
[raygun4js](https://github.com/MindscapeHQ/raygun4js) browser library.

It is published to npm as `ember-cli-raygun`. Consumers install it with
their package manager (`pnpm add ember-cli-raygun`, `npm install …`,
`yarn add …`) — there is no blueprint and no `ember install` step.

---

## 2. Repo layout

```
.
├── addon-main.cjs                # v2 addon entry (one-line @embroider/addon-shim)
├── rollup.config.mjs             # Builds src/ → dist/ + declarations/
├── babel.config.cjs
├── babel.publish.config.cjs
├── src/                          # Published source
│   ├── index.ts                  # Public exports: setupRaygun, RaygunService
│   ├── setup.ts                  # setupRaygun(appInstance, config)
│   ├── services/raygun.ts        # Ember Service wrapping window.rg4js
│   └── template-registry.ts      # Glint template registry
├── demo-app/                     # Manual-testing app, served by `pnpm start`
│   ├── app.gts                   # EmberApp (strict resolver) + setupRaygun wiring
│   ├── styles.css
│   └── templates/
│       ├── application.gts
│       ├── error-maker.gts       # Buttons that throw / report errors
│       └── other-one.gts
├── tests/
│   ├── index.html
│   ├── test-helper.ts            # Minimal TestApp (Router + RaygunService only)
│   └── unit/
│       ├── services/raygun-test.ts   # Service surface coverage
│       └── setup-test.ts             # setupRaygun branch coverage
├── unpublished-development-types/    # Ambient types for dev only
├── index.html                    # Demo-app vite entry
├── vite.config.mjs
├── testem.cjs
├── tsconfig.json / tsconfig.publish.json
├── eslint.config.mjs / .template-lintrc.mjs / .prettierrc.mjs
├── .try.mjs                      # @embroider/try compat scenarios
├── .github/workflows/
│   ├── ci.yml                    # Lint + test + try-scenarios matrix
│   └── push-dist.yml             # Publishes built tarball to `dist` branch
├── pnpm-workspace.yaml / pnpm-lock.yaml
├── package.json
├── README.md
├── CONTRIBUTING.md
└── AGENTS.md                     # ← you are here
```

**Where new code goes**

| You're adding…                      | Put it in…                                       |
| ----------------------------------- | ------------------------------------------------ |
| New service / setupRaygun behavior  | `src/...`                                        |
| Public types or exports             | `src/index.ts`                                   |
| Demo-app pages, styling, examples   | `demo-app/...`                                   |
| Unit tests                          | `tests/unit/...`                                 |
| Build/packaging changes             | `rollup.config.mjs`, `addon-main.cjs`            |
| CI / matrix                         | `.github/workflows/ci.yml`, `.try.mjs`           |

---

## 3. Architecture (mental model)

### Public exports (`src/index.ts`)

- `RaygunService` — Ember `Service` wrapping `window.rg4js`. Every method
  (`send`, `setUser`, `trackEvent`, plus setters for `apiKey`,
  `enableCrashReporting`, `enablePulse`, `options`) is guarded by an
  rg4js-availability check and `console.warn`s instead of throwing when
  the CDN script didn't load.
- `setupRaygun(appInstance, config)` — explicit bootstrap. Consumers call
  this from an instance initializer (or `App.instanceInitializer({...})`).

### Bootstrap flow (consumer side)

```
1. Consumer pastes the raygun4js loader <script> into their index.html
   (v2 addons can't inject into the host's <head>).
2. Consumer calls setupRaygun(appInstance, { apiKey, enableCrashReporting,
   enablePulse?, options?, trackPageViews? }) from an instance initializer.
3. setupRaygun:
   - Returns early if !enableCrashReporting (zero side effects).
   - Looks up service:raygun (warns if missing).
   - Sets apiKey, enableCrashReporting=true, enablePulse (default true).
   - Conditionally sets options.
   - Registers window.addEventListener('unhandledrejection', …) → raygun.send.
   - Wraps appInstance.onerror, chaining any pre-existing handler.
   - If trackPageViews !== false, subscribes router 'routeDidChange' →
     trackEvent({ type: 'pageView', path: transition.to?.name }).
```

### What changed from v1

| v1 (ember-cli addon)                                        | v2 (this repo)                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `addon/` + `app/` re-export pair                            | Single `src/` tree, built by Rollup                                                         |
| `index.js` `contentFor('head')` injected raygun4js loader   | Consumer pastes the loader `<script>` into their own `index.html`                           |
| Auto-wired via shipped `instance-initializers/raygun.js`    | Consumer calls `setupRaygun(appInstance, config)` themselves                                |
| Config read from `ENV.raygun` via `@embroider/macros`       | Config passed directly to `setupRaygun` as a JS object                                      |
| `enablePulse` hardcoded on, `ENV.raygun.options` was no-op  | Both honored: `enablePulse` defaults to `true`, `options` forwarded to `rg4js('options',…)` |
| `tests/dummy/` + ember-try                                  | `demo-app/` (manual only) + `.try.mjs` (@embroider/try) for compat matrix                   |

---

## 4. Public consumer API

```ts
import { setupRaygun, type RaygunService } from 'ember-cli-raygun';

// app/instance-initializers/raygun.js (or App.instanceInitializer({...}) in app.js)
export function initialize(appInstance) {
  setupRaygun(appInstance, {
    apiKey: 'YOUR_KEY',
    enableCrashReporting: true,    // typically: environment === 'production'
    enablePulse: true,             // optional, default true
    trackPageViews: true,          // optional, default true
    options: { /* raygun4js options */ }, // optional
  });
}
```

Service usage:

```ts
import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type { RaygunService } from 'ember-cli-raygun';

export default class ApplicationRoute extends Route {
  @service declare raygun: RaygunService;

  beforeModel() {
    this.raygun.setUser({ identifier, email, fullName, isAnonymous: false });
    this.raygun.trackEvent({ type: 'customTiming', name: 'X', duration: 1200 });
    this.raygun.send(new Error('manual report'));
  }
}
```

When changing the public surface, update `README.md` and the demo-app
templates to keep them in sync.

---

## 5. Development workflow

### Setup

```bash
pnpm install
```

This is a pnpm workspace; **don't** mix in `npm` or `yarn`.

### Run the demo app

```bash
pnpm start            # vite dev → http://localhost:5173
```

The `error-maker` route exposes interactive buttons for triggering
synchronous JS errors, "Ember" errors, unhandled promise rejections, and
manual `rg4js('send', …)` calls. It also includes a user-identity form
(submit-driven) to exercise `raygun.setUser`.

The placeholder API key (`YOUR_API_KEY_HERE` in `demo-app/app.gts`) means
real network sends will return 403; the in-page "What have we sent to
Raygun?" panel uses an `onBeforeSend` hook to show the payload locally
and `return false` to suppress the network call.

### Tests

```bash
pnpm test             # vite build + testem ci
```

This addon follows the v2-addon convention: tests cover the addon's
**exports** (`RaygunService`, `setupRaygun`), not the demo app. There
are no acceptance tests — the demo app is for manual exploration only.

### Linting

```bash
pnpm lint             # runs all lint:* in parallel
pnpm lint:fix         # autofixable subset
```

Sub-tasks: `lint:js` (eslint), `lint:hbs` (ember-template-lint),
`lint:format` (prettier --check), `lint:types` (ember-tsc --noEmit),
`lint:publish` (build + publint).

### Compatibility matrix

```bash
pnpm dlx @embroider/try list
pnpm dlx @embroider/try apply ember-lts-6.4
pnpm install --no-lockfile
pnpm test
```

Scenarios live in `.try.mjs`. CI runs the full matrix.

---

## 6. Coding conventions

- **TypeScript everywhere**: addon source (`src/`), demo (`demo-app/`),
  and tests are all `.ts` / `.gts`.
- **Octane / Glimmer idioms**: native classes, `@service` decorator,
  `@tracked`, template-tag SFCs (`<template>...</template>`).
- **ESLint flat config** (`eslint.config.mjs`).
- **Strict resolver** (`ember-strict-application-resolver`): every module
  the framework needs must be in `App#modules`. Use
  `import.meta.glob('./templates/**/*', { eager: true })` to bulk-register
  templates without enumerating each one.
- **No new runtime dependencies** without a clear justification — the
  addon must stay small. Current runtime deps: `@embroider/addon-shim`,
  `decorator-transforms`.
- **Guard every `rg4js` call** with `getRg4js()` (or the equivalent
  availability check) and `console.warn` on the failure path — don't
  throw.
- **Compose, don't replace** when wrapping host hooks (e.g.,
  `appInstance.onerror` chains the existing handler).
- **Pin GitHub Actions to commit SHAs** with the version as a comment
  (e.g., `actions/checkout@de0fac... # v6.0.2`).

---

## 7. Testing patterns

- **Service tests** (`tests/unit/services/raygun-test.ts`) stub
  `window.rg4js` with a spy array and assert the correct command
  strings/argument shapes are forwarded. Round-trip every setter; assert
  the rg4js-missing path warns + no-ops for every method.
- **`setupRaygun` tests** (`tests/unit/setup-test.ts`) cover every
  branch: early-exit when disabled, full configuration when enabled,
  `enablePulse` default + explicit, `options` absent, missing
  `service:raygun` warning, `unhandledrejection` → `raygun.send`,
  `appInstance.onerror` chaining, `routeDidChange` → pageView,
  `trackPageViews: false`.
- **End-to-end manual checks** belong in the demo app, not the test
  suite. The demo's `error-maker` route is the harness.
- After any change to `src/services/raygun.ts` or `src/setup.ts`, **add
  or update tests**.

---

## 8. Known issues & gotchas

1. **`enablePulse` command name** may be stale vs current raygun4js
   docs (modern docs prefer `enableRealUserMonitoring` /
   `options.disablePulse`). Verify before relying on it.
2. **Page-view tracking uses route names** (`transition.to?.name`,
   e.g. `posts.show`), not actual URLs. Consider `router.currentURL`.
3. **Possible duplicate reporting**: Raygun's own global handler,
   `appInstance.onerror`, and the `unhandledrejection` listener may
   overlap. Not currently validated.
4. **`@ember/error` is removed** in modern Ember. The demo's "Ember
   error" button just throws a plain `Error`.
5. The compat scenarios in `.try.mjs` (`ember-lts-5.8`,
   `ember-lts-5.12`) build against `@embroider/compat`. Template-tag
   SFCs as **route templates** don't work on those Ember versions —
   that's why the test app no longer registers any demo templates.

---

## 9. Release / publishing

This is a public npm package. Publishing is **not** automated — do not
run `pnpm publish` from an agent without explicit user confirmation.

A `dist` branch is automatically maintained by
`.github/workflows/push-dist.yml` so consumers can install from git
(`"ember-cli-raygun": "github:MindscapeHQ/ember-cli-raygun#dist"`)
without needing to run the build locally.

Version bumps go in `package.json`. Update the README "thanks" /
breaking-changes sections as needed.

---

## 10. Things NOT to do

- **Don't add an instance initializer back to the addon** — explicit
  `setupRaygun` is the v2 API; auto-wiring is what we just removed.
- **Don't try to inject `<script>` tags from `addon-main.cjs`** — v2
  addons can't write to the host's `<head>`. Document the snippet in
  the README and let consumers paste it.
- **Don't bypass the rg4js availability guards** — the addon must
  degrade gracefully when CSP/network blocks the CDN.
- **Don't bundle `raygun4js` as a runtime dependency** — keep using the
  CDN snippet so the loader can self-update. Importing types from
  `@types/raygun4js` (a devDependency) is fine and is how `RaygunService`
  / `setupRaygun` are typed.
- **Don't add per-template imports back to `tests/test-helper.ts`** —
  the test app intentionally has no demo templates so the addon's tests
  pass on every Ember version in the compat matrix.
- **Don't use `data-test-*` selectors in CSS.** Use a regular class
  alongside.
- **Don't bump major Ember versions** without running the @embroider/try
  matrix and updating `.try.mjs`.
- **Don't run `git push --force`, `pnpm publish`, or open PRs** without
  explicit user instruction.

---

## 11. Quick reference

| Task                         | Command                              |
| ---------------------------- | ------------------------------------ |
| Install deps                 | `pnpm install`                       |
| Run demo app                 | `pnpm start`                         |
| Run tests                    | `pnpm test`                          |
| Lint everything              | `pnpm lint`                          |
| Autofix lint                 | `pnpm lint:fix`                      |
| Type-check                   | `pnpm lint:types`                    |
| Production build             | `pnpm build`                         |
| List compat scenarios        | `pnpm dlx @embroider/try list`       |
| Apply a compat scenario      | `pnpm dlx @embroider/try apply <id>` |
