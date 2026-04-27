# ember-cli-raygun

[![Ember Observer Score](http://emberobserver.com/badges/ember-cli-raygun.svg)](http://emberobserver.com/addons/ember-cli-raygun)

A [Raygun](https://raygun.com) crash-reporting + Pulse RUM integration for
Ember.js applications, wrapping the
[raygun4js](https://github.com/MindscapeHQ/raygun4js) browser library.

> **v3.0.0** ships as a [v2 Ember addon](https://github.com/embroider-build/embroider/blob/main/docs/v2-faq.md).
> If you're upgrading from v2.x, see the [migration guide](#migrating-from-v2x) below.

---

## Installation

```bash
pnpm add -D ember-cli-raygun
# or
npm install --save-dev ember-cli-raygun
```

> v2-format addons do not run `ember install` blueprints. The two
> install steps that the old blueprint did for you (config snippet +
> initializer) are now manual — see below.

## Configuration

### 1. Add the raygun4js loader to your app's `index.html`

v2-format addons can't inject `<script>` tags into the host app's HTML
at build time — modern Ember apps own their `index.html`/`app/index.html`
outright. Paste the official Raygun loader into your `<head>` so it can
catch errors from the very first tick of execution:

```html
<!-- app/index.html (or index.html for Vite-driven apps) -->
<script type="text/javascript">
  !(function (a, b, c, d, e, f, g, h) {
    (a.RaygunObject = e),
      (a[e] =
        a[e] ||
        function () {
          (a[e].o = a[e].o || []).push(arguments);
        }),
      (f = b.createElement(c)),
      (g = b.getElementsByTagName(c)[0]),
      (f.async = 1),
      (f.src = d),
      g.parentNode.insertBefore(f, g),
      (h = a.onerror),
      (a.onerror = function (b, c, d, f, g) {
        h && h(b, c, d, f, g),
          g || (g = new Error(b)),
          (a[e].q = a[e].q || []),
          a[e].q.push({ e: g });
      });
  })(
    window,
    document,
    'script',
    'https://cdn.raygun.io/raygun4js/raygun.min.js',
    'rg4js',
  );
</script>
```

If you'd rather skip Raygun entirely in development, wrap the snippet in
an `{{#if}}` (classic builds) or just omit it from the dev `index.html`.
The runtime degrades gracefully — every service call no-ops with a
`console.warn` when `window.rg4js` is absent.

### 2. Add your config to `config/environment.js`

```js
module.exports = function (environment) {
  const ENV = {
    /* ... */
    raygun: {
      apiKey: 'paste_your_api_key_here',
      enableCrashReporting: environment === 'production',
      enablePulse: true,
      // options: { allowInsecureSubmissions: true },
    },
  };
  return ENV;
};
```

### 3. Wire up the runtime (replaces the deprecated instance-initializer)

In v2.x the addon shipped an instance-initializer that automatically
called into raygun4js after boot. **Instance initializers are deprecated
in modern Ember**, so v3 removes ours and exposes a `setupRaygun()`
function that you call yourself. Pick whichever spot fits your app:

#### Option A — your own instance-initializer (recommended, minimal diff)

`setupRaygun` needs an `ApplicationInstance` (so it can `lookup` the
service and the router), so the most natural place to call it is from a
host-owned instance-initializer. This is also the smallest possible
diff if you're upgrading from v2.x.

```js
// app/instance-initializers/raygun.js
import config from 'my-app/config/environment';
import { setupRaygun } from 'ember-cli-raygun';

export function initialize(appInstance) {
  setupRaygun(appInstance, config.raygun);
}

export default { initialize };
```

#### Option B — register the initializer inline in `app/app.js`

If you'd rather not add a separate file, register it directly on the
`Application` class:

```js
// app/app.js
import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'my-app/config/environment';
import { setupRaygun } from 'ember-cli-raygun';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

App.instanceInitializer({
  name: 'raygun',
  initialize(appInstance) {
    setupRaygun(appInstance, config.raygun);
  },
});

loadInitializers(App, config.modulePrefix);
```

> Don't be tempted to call `setupRaygun(this, …)` from
> `Application#ready()` — `this` is the `Application`, not an
> `ApplicationInstance`, and it has no `lookup` method.

`setupRaygun` is a no-op when `config.raygun.enableCrashReporting` is
false, so it's safe to call unconditionally.

## Using the service

Inject `service:raygun` anywhere you need it:

```js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service raygun;

  beforeModel() {
    this.raygun.setUser({
      identifier: 'user-123',
      isAnonymous: false,
      email: 'a@b.com',
      fullName: 'Ada Lovelace',
    });

    this.raygun.trackEvent({
      type: 'customTiming',
      name: 'IndexRouteBeforeModel',
      duration: 1200,
    });

    this.raygun.send(new Error('manual report'));
  }
}
```

Every method guards against `rg4js` being unavailable (e.g. blocked by
CSP or network) and `console.warn`s instead of throwing.

## Content Security Policy

If your app uses CSP without `unsafe-inline`, allow the inline loader
script and the Raygun CDN/API:

* `script-src`
  * `'sha256-kOJzCjwwBHVC6EAEX5M+ovfu9sE7JG0G9LcYssttn6I='`
  * `https://cdn.raygun.io`
* `connect-src`
  * `https://api.raygun.io`

## Migrating from v2.x

| v2.x                                       | v3.x                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `ember install ember-cli-raygun`           | `pnpm add -D ember-cli-raygun` + manual config                                                            |
| Loader injected by `contentFor('head')`    | Paste the loader `<script>` into your `index.html` yourself (see step 1)                                  |
| Auto instance-initializer                  | Call `setupRaygun(appInstance, config.raygun)`                                                            |
| `ENV.raygun.options` silently ignored      | Forwarded to `rg4js('options', …)`                                                                        |
| `enablePulse` always on                    | Configurable via `ENV.raygun.enablePulse`                                                                 |
| Page-view path was the route name          | Still the route name (override with `trackPageViews: false` and wire your own analytics if you want URLs) |
| Loader script used `//cdn.raygun.io`       | Uses `https://cdn.raygun.io`                                                                              |
| Service in `addon/services/raygun.js` (JS) | `src/services/raygun.ts` (TypeScript)                                                                     |

The public service API (`apiKey`, `enableCrashReporting`, `enablePulse`,
`options`, `send`, `setUser`, `trackEvent`) is unchanged.

## Development

This is a single-package v2 addon — `src/` holds the addon, `demo-app/`
is the playground, `tests/` runs against `demo-app/`.

```bash
pnpm install
pnpm start          # vite dev server with the demo app
pnpm test           # build + run the qunit test suite
pnpm lint           # eslint + ember-template-lint + prettier + tsc
pnpm build          # rollup build → dist/
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more.

## Thanks ❤

* [@aklkv](https://github.com/aklkv)
* [@jakesjews](https://github.com/jakesjews)
* [@jrjamespdx](https://github.com/jrjamespdx)
* [@fundead](https://github.com/fundead)
* [@JonathanPrince](https://github.com/JonathanPrince)
* [@j5alive](https://github.com/j5alive)
* [@josephambe](https://github.com/josephambe)
* [@pixelhandler](https://github.com/pixelhandler)
* [@archit](https://github.com/archit)
* [@cibernox](https://github.com/cibernox)
* [@dwnz](https://github.com/dwnz)
