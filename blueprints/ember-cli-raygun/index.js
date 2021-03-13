/* eslint-env node */
'use strict';

const EOL = require('os').EOL;
const chalk = require('chalk');
const fs = require('fs-extra');
const Promise = require('rsvp');
const readFile = Promise.denodeify(fs.readFile);

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
        this.ui.writeLine(
          EOL +
          chalk.green('********************************************************') + EOL +
          chalk.blue('Raygun') + ' has been installed.' + EOL +
          'Please set your API Key in ' + chalk.green('config/environment.js') + '.' + EOL +
          'If you don\'t have a key, get one at https://raygun.com!' + EOL +
          chalk.green('********************************************************') + EOL
        );
      });
  },

  fileContains(filePath, snippet) {
    return readFile(filePath).then((fileContents) => fileContents.toString().indexOf(snippet) !== -1);
  }
};