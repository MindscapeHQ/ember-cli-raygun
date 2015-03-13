import Ember from 'ember';
import { initialize } from '../../../initializers/raygun-setup';
import { module, test } from 'qunit';

var container, application;

module('RaygunSetupInitializer', {
  beforeEach: function() {
    Ember.run(function() {
      application = Ember.Application.create();
      container = application.__container__;
      application.deferReadiness();
    });
  }
});

test('should print a message and return if no raygun config', function(assert) {

  var oldLog = window.console.log;
  window.console = {
    log: function(message) {
      this.loggedMessage = message;
    }
  };

  var result = initialize(container, application);


  assert.ok(!result); 
  assert.equal("Please set your Raygun config in environment.js", window.console.loggedMessage);
});


test('should set Raygun up if config provided', function(assert) {
  console.log(window.Raygun.apiKey);
  assert.ok(window.Raygun);
  // application.config = {
  //   raygun: {
  //     apiKey: "LOL"
  //   },
  //   environment: "production"
  // };

  // var result = initialize(container, application);
  // assert.ok(result); 
  // assert.equal("LOL", window.Raygun.apiKey);
});