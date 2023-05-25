# Ember CLI Raygun
[![Build Status](https://travis-ci.org/MindscapeHQ/ember-cli-raygun.svg?branch=master)](https://travis-ci.org/MindscapeHQ/ember-cli-raygun)
[![Ember Observer Score](http://emberobserver.com/badges/ember-cli-raygun.svg)](http://emberobserver.com/addons/ember-cli-raygun)

This addon will allow you to report errors to [Raygun](https://raygun.com) from your Ember CLI app using [raygun4js](https://github.com/MindscapeHQ/raygun4js).

# Legacy Provider Notice

There is a known issue that prevents this provider from working with Ember.js versions greater than 3.1, see [deprecation of Ember.Logger](https://rfcs.emberjs.com/id/0297-deprecate-ember-logger).

An update is planned. In the meantime, a workaround can be made by adding a `Logger` object back into Ember which delegates to the equivalent `console` methods.

:heart: Please [open an issue](https://github.com/MindscapeHQ/ember-cli-raygun/issues/new) if you run into any troubles, thanks for testing!

---

## CLI installation

```bash
$ ember install ember-cli-raygun --api_key='paste_your_api_key_here'
```

Alternatively, you can set your API key manually by starting with:

```bash
$ ember install ember-cli-raygun
```

Next, set your API key in `config/environment.js`:

```js
var ENV = {
  // ...
  raygun: {
    apiKey:  "paste_your_api_key_here",
    enableCrashReporting: (environment === "production")
  }
  // ...
```

*The default blueprint (which runs during ember install ember-cli-raygun) will add the above config in your app's config/environment.js file.*

## Release

Raygun will now track errors in your deployed application. By default, Ember CLI Raygun is disabled unless your environment is set to "production". You can configure this behavior in `config/environment.js`.

# Additional Configruation

## CORS

`ember-cli-raygun` will automatically inject the [raygun4js](https://github.com/MindscapeHQ/raygun4js) bootstrap script into the head of your Ember app. This is the most reliable way to catch errors (even during app initialization).

If you’re using CORS without `unsafe-inline`, you’ll need to add the following directives to ensure `rg4js` and Raygun load correctly:

* `script-src`
  - 'sha256-kOJzCjwwBHVC6EAEX5M+ovfu9sE7JG0G9LcYssttn6I='
  - 'http://cdn.raygun.io'

* `connect-src`
  - https://api.raygun.io

### Accessing Raygun

Functions you might need on `rg4js` are exposed as an [Ember Service](https://guides.emberjs.com/release/tutorial/part-2/service-injection/), for instance tracking custom events:

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service raygun;

  beforeModel() {
    this.raygun.trackEvent({
      type: 'customTiming',
      name: 'IndexRouteBeforeModel',
      duration: 1200
    })
  }
}
```

## User Tracking

Check out the [Customers](https://github.com/MindscapeHQ/raygun4js#customers) section in the raygun4js documentation for full details.

Add the following snippet into your application route in `app/routes/application.js`:

```js
// ...
  @service user;
  @service raygun;

  beforeModel: () {
    this.setRaygunUser();
  },

  setRaygunUser: () {
    this.raygun.setUser({
      identifier: this.get("user.id"),
      isAnonymous: false,
      email: this.get("user.email"),
      firstName: this.get("user.firstName"),
      fullName: this.get("user.fullName")
    });    
  },
// ...
```

## Thanks! :heart:

Thanks to:

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

For your contributions on the previous version of this addon :) 

## Contributing

Pull requests are welcome!

* `git clone` this repository
* `yarn install`

## Running tests

* `ember test` OR
* `ember test --server`

There’s a detailed test harness in the `dummy` app so please check that your changes work end-to-end by running that.
