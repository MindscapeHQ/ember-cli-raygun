# Ember CLI Raygun
[![Build Status](https://travis-ci.org/MindscapeHQ/ember-cli-raygun.svg?branch=master)](https://travis-ci.org/MindscapeHQ/ember-cli-raygun)
[![Ember Observer Score](http://emberobserver.com/badges/ember-cli-raygun.svg)](http://emberobserver.com/addons/ember-cli-raygun)

This addon will allow you to report errors to [Raygun](https://raygun.io) from your Ember CLI app using [raygun4js](https://github.com/MindscapeHQ/raygun4js)

**Note:** This add on is currently in Beta! You may hit issues - please open an issue on Github if you have any problems! :heart:

It's as easy as:

```bash
$ ember install ember-cli-raygun
```

Optionally you can pass your Raygun API Key:

```bash
$ ember install ember-cli-raygun --api_key='YOUR-RAYGUN-API-KEY'
```

Otherwise, you’ll need to set your Raygun API Key (available under "Application Settings" in your Raygun Account) in `config/environment.js`

```js
// config/environment.js
var ENV = {
  // ...
  raygun: {
    apiKey:  "YOUR-RAYGUN-API-KEY",
    enableCrashReporting: (environment === "production")
  }
  // ...
```

The default blueprint (which runs during `ember install ember-cli-raygun`) will add the above config in your app's `config/environment.js` file.

Congratulations! You can now track and fix your errors once you deploy your app. (By default Ember CLI Raygun is disabled unless your environment is set to "production" - you can configure that behaviour in `config/environment.js`)

### CORS

`ember-cli-raygun` will automatically inject the [raygun4js](https://github.com/MindscapeHQ/raygun4js) bootstrap script into the head of your Ember app. This is the most reliable way to catch errors (even during app initialization).

If you’re using CORS without `unsafe-inline`, you’ll need to add the following directives to ensure `rg4js` and Raygun load correctly:

* `script-src`
  - 'sha256-kOJzCjwwBHVC6EAEX5M+ovfu9sE7JG0G9LcYssttn6I='
  - 'http://cdn.raygun.io'

* `connect-src`
  - https://api.raygun.io

### Accessing Raygun

Functions you might need on rg4js are exposed as an [Ember Service](https://guides.emberjs.com/release/tutorial/part-2/service-injection/), for instance tracking custom events:

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {
  @service raygun;

  beforeModel() {
    this.get('raygun').trackEvent({
      type: 'customTiming',
      name: 'IndexRouteBeforeModel',
      duration: 1200
    })
  }

}
```

### Affected User Tracking

Check out the [Affected User Tracking](https://github.com/MindscapeHQ/raygun4js#affected-user-tracking) section in the raygun4js documentation for full details.

You potentially want something like the following in your `application` route:

```js
// app/routes/application.js
// ...

  @service user;
  @service raygun;

  beforeModel: () {
    this.setRaygunUser();
  },

  setRaygunUser: () {
    this.get("raygun").setUser({
      identifier: this.get("user.id"),
      isAnonymous: false,
      email: this.get("user.email"),
      firstName: this.get("user.firstName"),
      fullName: this.get("user.fullName")
    });    
  },
// ...
```

### Thanks! :heart:

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

### Contributing

Pull requests are welcome!

* `git clone` this repository
* `npm install`
* `bower install`

### Running tests

* `ember test` OR
* `ember test --server`