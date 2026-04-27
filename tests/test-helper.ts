import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import { setTesting } from '@embroider/macros';
import PageTitleService from 'ember-page-title/services/page-title';
import { RaygunService } from '#src/index.ts';

import ApplicationTemplate from '../demo-app/templates/application.gts';
import ErrorMakerTemplate from '../demo-app/templates/error-maker.gts';
import OtherOneTemplate from '../demo-app/templates/other-one.gts';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

Router.map(function () {
  this.route('error-maker', { path: '/' });
  this.route('other-one');
});

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    './services/page-title': { default: PageTitleService },
    './services/raygun': { default: RaygunService },
    './templates/application': { default: ApplicationTemplate as unknown },
    './templates/error-maker': { default: ErrorMakerTemplate as unknown },
    './templates/other-one': { default: OtherOneTemplate as unknown },
  };
}

export function start() {
  setTesting(true);
  setApplication(
    TestApp.create({
      autoboot: false,
      rootElement: '#ember-testing',
    }),
  );
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
