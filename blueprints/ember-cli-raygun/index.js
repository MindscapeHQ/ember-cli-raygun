/* eslint-env node */
'use strict';

const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);

module.exports = {
  description: 'Sets up Raygun for your Ember CLI project',

  normalizeEntityName() { },

  // "borrowed" from Emberfire. Thanks folks!
  // https://github.com/firebase/emberfire/blob/master/blueprints/emberfire/index.js

  availableOptions: [{
    name: 'api_key',
    type: String
  }],

  afterInstall(options) {
    return this.fileContains('config/environment.js', 'raygun')
      .then((contains) => {
        // if Raygun is already set up, don't do anything
        if (contains) {
          return true;
        }

        let config = `    raygun: {
      apiKey: "${options.apiKey || 'YOUR-RAYGUN-API-KEY'}",
      enableCrashReporting: (environment === "production")
    },`;

        return this.insertIntoFile('config/environment.js', config, { after: `environment,\n` });
      })
      .then(() => {
        this.ui.writeLine('');
        this.ui.writeLine('********************************************************', 'green');
        this.ui.writeLine('Raygun has been installed.', 'blue');
        this.ui.writeLine('Please set your API Key in config/environment.js.');
        this.ui.writeLine("If you don't have a key, get one at https://raygun.com!");
        this.ui.writeLine('********************************************************', 'green');
      });
  },

  fileContains(filePath, snippet) {
    return readFile(filePath).then((fileContents) => fileContents.toString().indexOf(snippet) !== -1);
  }
};
