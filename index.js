/* eslint-env node */
'use strict';

const path = require('path');

module.exports = {
  name: 'ember-cli-raygun',

  blueprintsPath() {
    return path.join(__dirname, 'blueprints');
  },

  included(app) {
    this._super.included(app);
    app.import('node_modules/raygun4js/dist/raygun.js');
  }
};
