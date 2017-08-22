/* eslint-env node */
'use strict';

var EOL = require('os').EOL;
const blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
const file = require('ember-cli-blueprint-test-helpers/chai').file;
const expect = require('ember-cli-blueprint-test-helpers/chai').expect;

const setupTestHooks = blueprintHelpers.setupTestHooks;
const emberNew = blueprintHelpers.emberNew;
const emberGenerate = blueprintHelpers.emberGenerate;


describe('Acceptance: ember generate ember-cli-raygun', function() {
  setupTestHooks(this);

  it('ember-cli-raygun with api key passed in', function() {
    let args = ['ember-cli-raygun', '--api_key=FACEYFACEFACE'];


  // pass any additional command line options in the arguments array
  return emberNew()
    .then(() => emberGenerate(args))
    .then(() =>
      expect(file('config/environment.js')).to.contain(`    raygun: {
      apiKey: "FACEYFACEFACE",
      enabled: (environment === "production")
    },`))
    });

  it('ember-cli-raygun without api key', function() {
    let args = ['ember-cli-raygun'];


  // pass any additional command line options in the arguments array
  return emberNew()
    .then(() => emberGenerate(args))
    .then(() =>
      expect(file('config/environment.js')).to.contain(`    raygun: {
      apiKey: "YOUR-RAYGUN-API-KEY",
      enabled: (environment === "production")
    },`))
    });

});
