import RSVP from 'rsvp';
import { getOwnConfig } from '@embroider/macros';
import Ember from 'ember';

export function initialize(applicationInstance) {
  const raygunConfig = getOwnConfig().raygunConfig;
  const raygunService = applicationInstance.lookup("service:raygun");

  if (!raygunConfig['enableCrashReporting']) {
    return
  }

  raygunService.apiKey = raygunConfig.apiKey;
  raygunService.enableCrashReporting = true;
  raygunService.enablePulse = true;

  if (raygunConfig.options) {
    raygunService.options = raygunConfig.options;
  }

  // Listen for unhandled promise rejections
  // https://github.com/MindscapeHQ/raygun4js#unhandled-promise-rejection
  RSVP.on('error', function (reason) {
    raygunService.send({
      error: reason
    });
  });

  const existingOnError = Ember.onerror;
  Ember.onerror = function (error) {
    if (existingOnError) existingOnError(error);
    raygunService.send(error);
  };

  _trackPulseEvents(applicationInstance);
}

function _trackPulseEvents(applicationInstance) {
  const router = applicationInstance.lookup('service:router');
  const raygunService = applicationInstance.lookup("service:raygun");

  // see https://api.emberjs.com/ember/3.25/classes/RouterService/events/routeDidChange?anchor=routeDidChange
  router.on('routeDidChange', (transition) => {
    raygunService.trackEvent({
      type: 'pageView',
      path: transition.to.name
    });
  })
}

export default {
  initialize
};
