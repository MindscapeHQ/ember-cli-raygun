/* eslint-env node */
'use strict';

const path = require('path');

module.exports = {
  name: 'ember-cli-raygun',

  options: {
    nodeAssets: {
      'raygun4js': {
        vendor: {
          srcDir: 'dist',
          destDir: 'raygun',
          include: ['raygun.js'],
        }
      }
    }
  },

  blueprintsPath() {
    return path.join(__dirname, 'blueprints');
  },

  included(app) {
    this._super.included(app);
    app.import('vendor/raygun/raygun.js');
  }
};
