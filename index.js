/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-raygun',

  included: function(app) {
    this.app = app;  
    this._super.included(app)
  
    app.import(app.bowerDirectory + "/raygun4js/dist/raygun.js");
  }
};