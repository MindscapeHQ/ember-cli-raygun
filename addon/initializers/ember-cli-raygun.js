/* global rg4js, Raygun */

import Ember from 'ember';

export default function(config) {

  const raygunConfig = config.raygun;

  if (!raygunConfig || !raygunConfig.apiKey) {
    Ember.assert("Make sure you set your Raygun API Key in config/environment.js!");
  }

  const enabled = !!raygunConfig.enabled;
  if (enabled) {
    const defaultCustomData = {
      environment: config.environment,
      appName: config.APP.name
    };

    const options = raygunConfig.options || {};
    const saveIfOffline = !!raygunConfig.saveIfOffline;
    const enableCrashReporting = !!raygunConfig.enableCrashReporting;

    rg4js('apiKey', raygunConfig.apiKey);
    rg4js('enableCrashReporting', enableCrashReporting);
    rg4js('options', options);
    rg4js('setVersion', config.APP.version);
    rg4js('saveIfOffline', saveIfOffline);
    rg4js('withCustomData', defaultCustomData);

    Ember.onerror = function(error) {
      Ember.Logger.error('Ember.onerror', error);
      Raygun.send(error);
    };

    Ember.RSVP.on('error', function(error) {
      // SEE: https://github.com/emberjs/ember.js/issues/5566
      if (error && error.hasOwnProperty('name') && error.name !== 'TransitionAborted') {
        Ember.Logger.error('Ember.RSVP error', error);
        Raygun.send(error);
      }
    });

    const defaultErrorHandler = Ember.Logger.error;

    Ember.Logger.error = function(message, cause, stack) {
      defaultErrorHandler(message, cause, stack);
      Raygun.send(new Error(message + " (" + cause + ")"), null, {
        cause: cause,
        stack: stack
       });
    };

    if (!raygunConfig.beQuiet) {
      Ember.Logger.info('Ember CLI Raygun Enabled and ready to report!');
    }
  }
  else {
    if (!raygunConfig.beQuiet) {
      Ember.Logger.info('FYI: Ember CLI Raygun is currently disabled, as config.raygun.enabled is false');
    }
  }

}
