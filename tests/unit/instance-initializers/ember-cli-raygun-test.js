/* global Raygun */

import Ember from 'ember';
import { initializeWithConfig } from '../../../instance-initializers/ember-cli-raygun';
import { module, test } from 'qunit';

var container, application;

module('Unit | Initializer | ember cli raygun', {
  beforeEach: function() {
    Ember.run(function() {
      application = Ember.Application.create();
      container   = application.registry;
      application.deferReadiness();
    });
  }
});

test('should raise an error if there is no API Key', function(assert) {
  assert.expect(1);

  // empty config
  let config = {};

  assert.throws(
     function() {
       initializeWithConfig(config);
     },
     /Make sure you set your Raygun API Key/
   );
});

test('raygun is configured with an API key', function(assert) {
  assert.expect(2);
  let done = assert.async();

  let config = {
    raygun: {
      apiKey: "abc123",
      enabled: true
    },
    APP: {
      name: "testing!"
    }
  };

  let oldInit = Raygun.init;
  Raygun.init = function(apiKey) {
    assert.equal(apiKey, "abc123");
    return {
      attach() {
        // we are attached
        assert.ok(true);
        done();
      }
    };
  };

  initializeWithConfig(config);

  Raygun.init = oldInit;

});

test('Raygun is called if we log an error with ember', function(assert) {
  assert.expect(1);
  let done = assert.async();

  // empty config
  let config = {
    raygun: {
      apiKey: "abc123",
      enabled: true
    },
    APP: {
      name: "testing!"
    }
  };

  let oldSend   = Raygun.send;

  Raygun.send = function(error) {
    assert.equal(error.message, "Test Explosion!");
    done();
  };

  initializeWithConfig(config);

  Ember.onerror(new Ember.Error("Test Explosion!"));
  Raygun.send = oldSend;

});
