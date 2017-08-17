'use strict';

var raygunConfigKey = 'raygun';

var EOL         = require('os').EOL;
var chalk       = require('chalk');
var fs          = require('fs-extra');
var Promise     = require('rsvp');
var readFile    = Promise.denodeify(fs.readFile);

module.exports = {

  normalizeEntityName: function () {},
  description: 'Sets up Raygun for your Ember CLI project',

  // "borrowed" from Emberfire. Thanks folks!
  // https://github.com/firebase/emberfire/blob/master/blueprints/emberfire/index.js

  availableOptions: [
    { name: 'api_key', type: String }
  ],

  afterInstall: function(options) {
    var self = this,
      raygunApiKey = options.api_key || 'YOUR-RAYGUN-API-KEY';


    return self.setupRaygunConfig(raygunApiKey).then(function () {
      var output = EOL;
      output += chalk.blue('Raygun') + ' has been installed. Please set your API Key in ' + chalk.green('config/environment.js') + '. If you don\'t have a key, get one at https://raygun.com!' + EOL;
      console.log(output);
    });
  },

  setupRaygunConfig: function (apiKey) {
    var self         = this;
    var indent       = '  ';
    var doubleIndent = indent + indent;

    return this.fileContains('config/environment.js', raygunConfigKey + ':').then(function (contains) {
      // if Raygun is already set up, don't do anything
      if (contains) { return true; }

      var options = { after: doubleIndent + 'environment: environment,' + EOL };

      // can't do the code here with JSON.stringify...
      var config = doubleIndent + raygunConfigKey + ': {' + EOL +
        doubleIndent + indent + 'apiKey: "' + apiKey + '",' + EOL +
        doubleIndent + indent + 'enabled: (environment === "production")' + EOL +
        doubleIndent + '},';

      return self.insertIntoFile('config/environment.js', config, options);
    });
  },

  fileContains: function (filePath, snippet) {
    return readFile(filePath).then(function (fileContents) {
      return fileContents.toString().indexOf(snippet) !== -1;
    });
  }

};
