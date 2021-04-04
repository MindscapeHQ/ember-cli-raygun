import Application from '@ember/application';

import { initialize } from 'dummy/instance-initializers/raygun';
import { module, test } from 'qunit';
import { run } from '@ember/runloop';
import Service from '@ember/service';
import { getOwnConfig } from '@embroider/macros';

class MockRaygunService extends Service { }

module('Unit | Instance Initializer | Raygun', function(hooks) {
  hooks.beforeEach(function() {
    this.defaultRaygunConfig = { ...getOwnConfig().raygunConfig }
    
    this.TestApplication = Application.extend();
    this.TestApplication.instanceInitializer({
      name: 'initializer under test',
      initialize
    });
    this.application = this.TestApplication.create({ autoboot: false });
    this.instance = this.application.buildInstance();

    this.instance.register('service:raygun', MockRaygunService);
  });
  hooks.afterEach(function() {
    getOwnConfig().raygunConfig = this.defaultRaygunConfig;

    run(this.instance, 'destroy');
    run(this.application, 'destroy');
  });

  test('sets API key', async function(assert) {
    await this.instance.boot();
    const raygunService = this.instance.lookup("service:raygun");

    assert.equal("YOUR_API_KEY_HERE", raygunService.apiKey);
  });

  test('enables crash reporting', async function (assert) {
    await this.instance.boot();
    const raygunService = this.instance.lookup("service:raygun");

    assert.equal(true, raygunService.enableCrashReporting);
  });

  test('enables pulse', async function (assert) {
    await this.instance.boot();
    const raygunService = this.instance.lookup("service:raygun");

    assert.equal(true, raygunService.enablePulse);
  });

  test('does nothing if crash reporting is disabled', async function (assert) {
    let config = getOwnConfig().raygunConfig;
    config.enableCrashReporting = false;

    await this.instance.boot();
    const raygunService = this.instance.lookup("service:raygun");

    assert.notOk(raygunService.enableCrashReporting);
    assert.equal(undefined, raygunService.apiKey);
  })

  test('allows passing options', async function (assert) {
    let config = getOwnConfig().raygunConfig;
    config.options = {
      testOption: true
    }

    await this.instance.boot();
    const raygunService = this.instance.lookup("service:raygun");

    assert.ok(raygunService.options.testOption);
  })

});
