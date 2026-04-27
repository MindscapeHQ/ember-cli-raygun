import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import { setTesting } from '@embroider/macros';
import { RaygunService } from '#src/index.ts';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

Router.map(function () {});

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    './services/raygun': { default: RaygunService },
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
