/* global rg4js */
import RSVP from 'rsvp';
import { getOwnConfig } from '@embroider/macros';

export function initialize(applicationInstance) {
  const raygunConfig = getOwnConfig().raygunConfig;

  if (!raygunConfig['enableCrashReporting']) {
    return
  }

  rg4js('apiKey', raygunConfig.apiKey);
  rg4js('enableCrashReporting', true);
  rg4js('enablePulse', true);
  
  if (raygunConfig.options) {
    rg4js('options', raygunConfig.options);
  }

  // Listen for unhandled promise rejections
  // https://github.com/MindscapeHQ/raygun4js#unhandled-promise-rejection
  RSVP.on('error', function (reason) {
    rg4js('send', {
      error: reason
    });
  });

  _trackPulseEvents(applicationInstance);

}

function _trackPulseEvents(applicationInstance) {
  const router = applicationInstance.lookup('service:router');

  // see https://api.emberjs.com/ember/3.25/classes/RouterService/events/routeDidChange?anchor=routeDidChange
  router.on('routeDidChange', (transition) => {
    rg4js('trackEvent', {
      type: 'pageView',
      path: transition.to.name
    });
  })
}

export default {
  initialize
};
