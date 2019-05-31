/* global Raygun */

import Ember from 'ember'
import { assert } from '@ember/debug';
import { assign } from '@ember/polyfills';
import { on } from 'rsvp';

export default function(config) {
  let raygunConfig = config.raygun;

  if (!raygunConfig || !raygunConfig.apiKey) {
    assert("Make sure you set your Raygun API Key in config/environment.js!");
  }

  if (raygunConfig.enabled) {

    let defaultCustomData = {
      environment: config.environment,
      appName:     config.APP.name
    };

    let initOptions = {};

    if (raygunConfig.enablePulse) {
      initOptions.disablePulse = false;
    }

    if (raygunConfig.disableCrashReporting) {
      initOptions.disableErrorTracking = true;
    }

    if (raygunConfig.options) {
      initOptions = assign(initOptions, raygunConfig.options);
    }

    Raygun.init(
      raygunConfig.apiKey,
      initOptions,
      assign(defaultCustomData, raygunConfig.customData)
    ).attach();

    Raygun.setVersion(config.APP.version);
    Raygun.saveIfOffline(raygunConfig.offlineEnabled);

    Ember.onerror = function (error) {
      // eslint-disable-next-line no-console
      console.info("Ember.onerror called");
      Raygun.send(error);
    };

    on('error', function (error) {
      Raygun.send(error);
    });

    let defaultErrorHandler = Ember.Logger.error;

    Ember.Logger.error = function (message, cause, stack) {
      defaultErrorHandler(message, cause, stack);
      Raygun.send(new Error(message + " (" + cause + ")"), null, {
        cause: cause,
        stack: stack
      });
    };

    if (!raygunConfig.beQuiet) {
      // eslint-disable-next-line no-console
      console.info("Ember CLI Raygun Enabled and ready to report!");
    }

  } else {
    if (!raygunConfig.beQuiet) {
      // eslint-disable-next-line no-console
      console.info("FYI: Ember CLI Raygun is currently disabled, as config.raygun.enabled is false");
    }
  }
}
