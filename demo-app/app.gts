import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import PageTitleService from 'ember-page-title/services/page-title';
import { RaygunService, setupRaygun } from '#src/index.ts';

import type ApplicationInstance from '@ember/application/instance';

import ApplicationTemplate from './templates/application.gts';
import ErrorMakerTemplate from './templates/error-maker.gts';
import OtherOneTemplate from './templates/other-one.gts';

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

Router.map(function () {
  this.route('error-maker', { path: '/' });
  this.route('other-one');
});

export class App extends EmberApp {
  modules = {
    './router': { default: Router },
    './services/page-title': { default: PageTitleService },
    './services/raygun': { default: RaygunService },
    './templates/application': { default: ApplicationTemplate as unknown },
    './templates/error-maker': { default: ErrorMakerTemplate as unknown },
    './templates/other-one': { default: OtherOneTemplate as unknown },
  };
}

// Demonstrates the manual-init migration path: register a one-line
// instance-initializer in your own app that calls `setupRaygun`. This
// replaces the auto-initializer that v2.x of the addon used to ship.
App.instanceInitializer({
  name: 'raygun',
  initialize(appInstance: ApplicationInstance) {
    setupRaygun(appInstance, {
      apiKey: 'YOUR_API_KEY_HERE',
      // Demo only — in a real app, drive this from your environment config.
      enableCrashReporting: true,
      enablePulse: true,
    });
  },
});
