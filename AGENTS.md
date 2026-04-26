# AGENTS.md — ember-cli-raygun

Guidance for AI agents (and humans) working in this repo. Read this before
making changes.

---

## 1. What this repo is

`ember-cli-raygun` is an **Ember CLI addon** (v2.0.0, Octane edition,
targeting Ember 4.12) that integrates the [Raygun.com](https://raygun.com)
crash-reporting and Pulse RUM service into an Ember application by wrapping
the [raygun4js](https://github.com/MindscapeHQ/raygun4js) browser library.

It is published to npm as `ember-cli-raygun` and consumed via
`ember install ember-cli-raygun`.

---

## 2. Repo layout

```
.
├── index.js                              # Build-time addon entry point (Node)
├── blueprints/ember-cli-raygun/index.js  # `ember install` blueprint
├── addon/                                # Real addon source (browser runtime)
│   ├── services/raygun.js                # Ember Service wrapping rg4js
│   └── instance-initializers/raygun.js   # Boot-time wiring
├── app/                                  # One-line re-exports into host namespace
│   ├── services/raygun.js
│   └── instance-initializers/raygun.js
├── config/
│   ├── environment.js                    # Addon's own ember-cli config
│   └── ember-try.js                      # Compatibility scenarios
├── tests/
│   ├── dummy/                            # Full Ember app used as test host
│   ├── unit/                             # Service + initializer unit tests
│   └── test-helper.js
├── vendor/                               # (empty placeholder)
├── package.json
├── ember-cli-build.js
├── testem.js
├── README.md
└── CONTRIBUTING.md
```

**Where new code goes**

| You're adding…                           | Put it in…                                    |
| ---------------------------------------- | --------------------------------------------- |
| New Ember service / initializer logic    | `addon/...`, plus a re-export in `app/...`    |
| Build-time HTML or config behavior       | `index.js`                                    |
| `ember install` scaffolding              | `blueprints/ember-cli-raygun/index.js`        |
| Unit tests                               | `tests/unit/...`                              |
| End-to-end / integration test fixtures   | `tests/dummy/...`                             |

---

## 3. Architecture (mental model)

There are **two execution contexts** to keep straight:

### Build time (Node.js, runs `index.js`)

1. `contentFor('head', config)` injects an inline `<script>` that loads
   `https://cdn.raygun.io/raygun4js/raygun.min.js` and registers a
   queueing `window.rg4js` shim. Only injected when
   `ENV.raygun.enableCrashReporting` is true.
2. `config(_, appConfig)` copies `appConfig.raygun` into
   `@embroider/macros`' `setOwnConfig.raygunConfig` so addon runtime code
   can read it via `getOwnConfig()` without importing the host app's
   environment file.

### Runtime (browser, after Ember boots)

1. `addon/instance-initializers/raygun.js` runs once per app instance:
   - Reads `getOwnConfig().raygunConfig`.
   - Bails out early if `enableCrashReporting` is false (zero side effects).
   - Otherwise sets `apiKey`, `enableCrashReporting`, `enablePulse` on
     `service:raygun`.
   - Hooks `RSVP.on('error', …)` for unhandled promise rejections.
   - Wraps `applicationInstance.onerror` (chaining any prior handler).
   - Subscribes to `router.routeDidChange` to send Pulse `pageView` events.
2. `addon/services/raygun.js` is a thin Ember Service wrapping the global
   `window.rg4js`. Every call is guarded by `_isRaygunAvailable()` and
   `console.warn`s instead of throwing if the CDN script didn't load.

### Config flow diagram

```
config/environment.js (host app)
        │  ENV.raygun = { apiKey, enableCrashReporting, ... }
        ▼
index.js  (build time)
        ├─► contentFor('head') → <script> tag in index.html
        └─► @embroider/macros setOwnConfig.raygunConfig
                                        │
                                        ▼
                addon/instance-initializers/raygun.js (runtime)
                        ├─► service:raygun setters → rg4js('apiKey', ...)
                        ├─► RSVP.on('error', …)
                        ├─► applicationInstance.onerror = …
                        └─► router.on('routeDidChange', …)
```

---

## 4. Public consumer API

Consumers configure the addon via `config/environment.js`:

```js
ENV.raygun = {
  apiKey: 'YOUR_KEY',
  enableCrashReporting: environment === 'production',
  // options: { ... }   // accepted by config but currently a no-op (see §8)
};
```

And use it via service injection:

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service raygun;

  beforeModel() {
    this.raygun.setUser({ identifier, email, fullName, isAnonymous: false });
    this.raygun.trackEvent({ type: 'customTiming', name: 'X', duration: 1200 });
    this.raygun.send(new Error('manual report'));
  }
}
```

When changing the public surface, update `README.md` and the dummy app
demo (`tests/dummy/app/...`) to keep them in sync.

---

## 5. Development workflow

### Setup

```bash
npm install
```

Node 10.* or >= 12 (per `package.json#engines`).

### Run the dummy app

```bash
ember serve
# visit http://localhost:4200 → routes: /  (error-maker), /other-one
```

The `error-maker` route exposes interactive buttons for triggering
synchronous JS errors, Ember errors, and unhandled RSVP promise
rejections — use it to validate runtime behavior end-to-end.

### Tests

```bash
ember test                 # one-off run
ember test --server        # watch mode
npm test                   # lint + ember test
npm run test:ember-compatibility   # ember-try matrix (see config/ember-try.js)
```

### Linting

```bash
npm run lint               # eslint + ember-template-lint
npm run lint:js
npm run lint:hbs
```

CI runs on GitHub Actions (`.github/workflows/ci.yml`) — runs lint,
build, tests, and the ember-try compatibility matrix on every PR and
on pushes to `main`.

---

## 6. Coding conventions

- **Octane idioms**: native ES6 classes, `@service` decorator, Glimmer
  components. Don't introduce classic `Ember.Object.extend` or
  computed properties unless there's a strong reason.
- **ESLint config**: `.eslintrc.js` (extends `eslint-plugin-ember/octane`).
  Browser globals like `rg4js` must be declared via
  `/* global rg4js */` at the top of the file.
- **Template lint**: `.template-lintrc.js`.
- **No new runtime dependencies** without a clear justification — keep
  the addon footprint minimal. Current deps: `@embroider/macros`,
  `ember-cli-babel`, `ember-cli-htmlbars`.
- **Always re-export `addon/` modules from `app/`** so Ember's resolver
  can find them in the consuming app's namespace.
- **Guard every `rg4js` call** with `_isRaygunAvailable()` and
  `console.warn` on the failure path — don't throw.
- **Compose, don't replace** when wrapping host hooks (e.g.,
  `applicationInstance.onerror` chains the existing handler).

---

## 7. Testing patterns

- **Service tests** (`tests/unit/services/raygun-test.js`) stub
  `window.rg4js` with a spy array and assert the correct command
  strings/argument shapes are forwarded.
- **Initializer tests** (`tests/unit/instance-initializers/raygun-test.js`)
  register a `MockRaygunService extends Service {}`, then call
  `initialize(this.owner)` directly to verify config propagation and
  the `enableCrashReporting: false` early-exit.
- **End-to-end manual checks** belong in the dummy app, especially the
  `error-maker` route harness.
- After any change to `addon/services/raygun.js` or
  `addon/instance-initializers/raygun.js`, **add or update tests** —
  current coverage misses several paths (see §8).

---

## 8. Known issues & gotchas

These are intentional flagged issues. If you touch nearby code, fix
them or at least don't regress them.

1. **`ENV.raygun.options` is a no-op.** The initializer assigns
   `raygunService.options = raygunConfig.options`, but the service has
   no `options` setter and never calls `rg4js('options', …)`. The unit
   test passes only because the mock service is a plain object. Fix by
   adding a real `options` getter/setter on the service.
2. **Pulse is hardcoded on.** `enablePulse = true` runs unconditionally
   whenever crash reporting is enabled. Make it configurable via
   `ENV.raygun.enablePulse`.
3. **Verify the `enablePulse` command** against the loaded raygun4js
   version — modern docs prefer `enableRealUserMonitoring` /
   `options.disablePulse`.
4. **README mislabels CSP as "CORS"**, and the example uses
   `http://cdn.raygun.io`. Should be `https://`. The injected loader
   also uses a protocol-relative `//cdn.raygun.io/...` URL — prefer
   explicit `https://`.
5. **Possible duplicate reporting**: Raygun's own global handler,
   `applicationInstance.onerror`, and `RSVP.on('error')` may overlap.
   Not currently validated.
6. **Page-view tracking uses route names** (`transition.to.name`, e.g.
   `posts.show`), not actual URLs. Consider `router.currentURL`.
7. **Test gaps**: no coverage of `contentFor`, the macros bridge,
   RSVP/`onerror` hooks, route tracking, the `rg4js`-missing fallback,
   or `options` forwarding.
8. **Supported Ember floor (4.4+)** is not documented in the README
   despite being implied by `config/ember-try.js`.

---

## 9. Release / publishing

This is a public npm package distributed via
<https://www.npmjs.com/package/ember-cli-raygun>. The full release
procedure is documented in [`RELEASING.md`](./RELEASING.md).

Publishing is **not** automated — do not run `npm publish` or
`npm version` from an agent without explicit user confirmation.

---

## 10. Things NOT to do

- **Don't bypass the `_isRaygunAvailable()` guards** — the addon must
  degrade gracefully when CSP or network blocks the CDN.
- **Don't change the loader injection to be lazy/deferred** without
  understanding the trade-off: the inline `<head>` script exists
  specifically to capture errors during app boot.
- **Don't import `raygun4js` as an npm dependency** to "fix" the global
  — that's a deliberate design choice (see §3) and a larger discussion.
- **Don't edit `app/services/raygun.js` or
  `app/instance-initializers/raygun.js`** beyond their one-line
  re-export — real logic lives in `addon/`.
- **Don't bump major Ember versions** without running
  `npm run test:ember-compatibility` and updating `config/ember-try.js`.
- **Don't run `git push`, `npm publish`, or open PRs** without explicit
  user instruction.

---

## 11. Quick reference

| Task                                         | Command                                |
| -------------------------------------------- | -------------------------------------- |
| Install deps                                 | `npm install`                          |
| Run dummy app                                | `ember serve`                          |
| Run tests                                    | `ember test`                           |
| Run tests in watch mode                      | `ember test --server`                  |
| Lint                                         | `npm run lint`                         |
| Compatibility matrix                         | `npm run test:ember-compatibility`     |
| Production build (sanity check)              | `npm run build`                        |
