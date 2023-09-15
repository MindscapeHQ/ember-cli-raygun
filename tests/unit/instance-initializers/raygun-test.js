import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import { getOwnConfig } from '@embroider/macros';
import { initialize } from 'dummy/instance-initializers/raygun';

class MockRaygunService extends Service { }

module('Unit | Instance Initializer | Raygun', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.defaultRaygunConfig = { ...getOwnConfig().raygunConfig };

    this.owner.register('service:raygun', MockRaygunService);

    initialize(this.owner);
  });

  hooks.afterEach(function () {
    getOwnConfig().raygunConfig = this.defaultRaygunConfig;
  });

  test('sets API key', async function (assert) {
    const raygunService = this.owner.lookup("service:raygun");
    assert.equal("YOUR_API_KEY_HERE", raygunService.apiKey);
  });

  test('enables crash reporting', async function (assert) {
    const raygunService = this.owner.lookup("service:raygun");
    assert.equal(true, raygunService.enableCrashReporting);
  });

  test('enables pulse', async function (assert) {
    const raygunService = this.owner.lookup("service:raygun");
    assert.equal(true, raygunService.enablePulse);
  });

  test('does nothing if crash reporting is disabled', async function (assert) {
    let config = getOwnConfig().raygunConfig;
    config.enableCrashReporting = false;

    const raygunService = this.owner.lookup("service:raygun");

    assert.notOk(raygunService.enableCrashReporting);
    assert.equal(undefined, raygunService.apiKey);
  });

  test('allows passing options', async function (assert) {
    let config = getOwnConfig().raygunConfig;
    config.options = {
      testOption: true
    };

    const raygunService = this.owner.lookup("service:raygun");

    assert.ok(raygunService.options.testOption);
  });

});
