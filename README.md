# Ember CLI Raygun
[![Build Status](https://travis-ci.org/MindscapeHQ/ember-cli-raygun.svg?branch=master)](https://travis-ci.org/MindscapeHQ/ember-cli-raygun)
[![Ember Observer Score](http://emberobserver.com/badges/ember-cli-raygun.svg)](http://emberobserver.com/addons/ember-cli-raygun)

This addon will allow you to report errors to [Raygun](https://raygun.io) from your Ember CLI app using [raygun4js](https://github.com/MindscapeHQ/raygun4js)

**Note:** This add on is currently in Beta! You may hit issues - please open an issue on Github if you have any problems! :heart:

## Installation

It's as easy as:

```bash
$ ember install ember-cli-raygun
```

Now set your Raygun API Key (available under "Application Settings" in your Raygun Account) in `config/environment.js`

```js
// config/environment.js
var ENV = {
  // ...
  raygun: {
    apiKey:  "YOUR-RAYGUN-API-KEY",
    enabled: (environment === "production")
  }
  // ...
```

The default blueprint (which runs during `ember install ember-cli-raygun`) will add the above config in your app's `config/environment.js` file.

Congratulations! You can now track and fix your errors once you deploy your app. (By default Ember CLI Raygun is disabled unless your environment is set to "production" - you can configure that behaviour in `config/environment.js`)

### Affected User Tracking

Check out the [Affected User Tracking](https://github.com/MindscapeHQ/raygun4js#affected-user-tracking) section in the raygun4js documentation for full details.

You potentially want something like the following in your `application` route:

```js
// app/routes/application.js
// ...
  beforeModel: () {
    this.setRaygunUser();
  },

  setRaygunUser: () {
    // assuming you have a currentUser property available...
    Raygun.setUser(
      this.get("user.id"),
      false,
      this.get("user.email"),
      this.get("user.fullName"),
      this.get("user.firstName"),
    );    
  },
// ...
```

### Contributing

Pull requests are welcome!

* `git clone` this repository
* `npm install`
* `bower install`

### Running tests

* `ember test` OR
* `ember test --server`
