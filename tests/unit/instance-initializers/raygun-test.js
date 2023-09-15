import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Service from '@ember/service';
import { initialize } from 'ember-cli-raygun/instance-initializers/raygun';

class MockRaygunService extends Service {
  options = {};
  _apiKey = null;
  _enableCrashReporting = false;
  _enablePulse = false;

  get apiKey() {
    return this._apiKey;
  }

  set apiKey(newKey) {
    this._apiKey = newKey;
  }

  set enableCrashReporting(value) {
    this._enableCrashReporting = value;
  }

  get enableCrashReporting() {
    return this._enableCrashReporting;
  }

  set enablePulse(value) {
    this._enablePulse = value;
  }

  get enablePulse() {
    return this._enablePulse;
  }
}

module('Acceptance | Raygun instance initializer', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:raygun', MockRaygunService);
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig = envConfig.raygunConfig || {};
    this.defaultRaygunConfig = { ...envConfig.raygunConfig };
  });

  hooks.afterEach(function () {
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig = this.defaultRaygunConfig;
  });

  test('sets API key', function (assert) {
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig.apiKey = "YOUR_API_KEY_HERE";
    initialize(this.owner);

    const raygunService = this.owner.lookup('service:raygun');
    assert.equal("YOUR_API_KEY_HERE", raygunService.apiKey, 'API key should match');
  });

  test('enables crash reporting', function (assert) {
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig.apiKey = "YOUR_API_KEY_HERE";
    envConfig.raygunConfig.enableCrashReporting = true;
    initialize(this.owner);

    const raygunService = this.owner.lookup('service:raygun');
    assert.equal(true, raygunService.enableCrashReporting, 'Crash reporting should be enabled');
  });

  test('enables pulse', function (assert) {
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig.apiKey = "YOUR_API_KEY_HERE";
    envConfig.raygunConfig.enableCrashReporting = true;
    initialize(this.owner);

    const raygunService = this.owner.lookup('service:raygun');
    assert.equal(true, raygunService.enablePulse, 'Pulse should be enabled');
  });

  test('does nothing if crash reporting is disabled', function (assert) {
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig.apiKey = "YOUR_API_KEY_HERE";
    envConfig.raygunConfig.enableCrashReporting = false;
    initialize(this.owner);

    const raygunService = this.owner.lookup('service:raygun');
    assert.notOk(raygunService.enableCrashReporting, 'Crash reporting should be disabled');
    assert.notOk(raygunService.enablePulse, 'Pulse should be disabled');
    assert.equal(null, raygunService.apiKey, 'API key should be null');
  });

  test('allows passing options', function (assert) {
    const envConfig = this.owner.resolveRegistration('config:environment');
    envConfig.raygunConfig.options = { testOption: true };
    envConfig.raygunConfig.apiKey = "YOUR_API_KEY_HERE";
    envConfig.raygunConfig.enableCrashReporting = true;
    initialize(this.owner);

    const raygunService = this.owner.lookup('service:raygun');
    assert.ok(raygunService.options.testOption, 'Test option should be true');
  });

});
