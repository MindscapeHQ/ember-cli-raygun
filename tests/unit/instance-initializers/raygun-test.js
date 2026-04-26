import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { getOwnConfig } from '@embroider/macros';
import Service from '@ember/service';
import RSVP from 'rsvp';
import { initialize } from 'dummy/instance-initializers/raygun';

class MockRaygunService extends Service {
  constructor() {
    super(...arguments);
    this.calls = [];
  }
  send(...args) {
    this.calls.push(['send', args]);
  }
  trackEvent(...args) {
    this.calls.push(['trackEvent', args]);
  }
}

module('Unit | Instance Initializer | Raygun', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.defaultRaygunConfig = { ...getOwnConfig().raygunConfig };

    // Snapshot RSVP error handlers so we can restore after each test.
    this.rsvpHandlers = [];
    this.origRsvpOn = RSVP.on;
    RSVP.on = (evt, fn) => {
      this.rsvpHandlers.push([evt, fn]);
      return this.origRsvpOn.call(RSVP, evt, fn);
    };

    this.owner.unregister('service:raygun');
    this.owner.register('service:raygun', MockRaygunService);
  });

  hooks.afterEach(function () {
    getOwnConfig().raygunConfig = this.defaultRaygunConfig;

    // Detach any RSVP handlers our initializer registered to avoid cross-test leakage.
    for (const [evt, fn] of this.rsvpHandlers) {
      RSVP.off(evt, fn);
    }
    RSVP.on = this.origRsvpOn;
  });

  // ---------------------------------------------------------------------------
  // Existing config-propagation tests (kept intact)
  // ---------------------------------------------------------------------------

  test('sets API key', async function (assert) {
    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');
    assert.equal(raygunService.apiKey, 'YOUR_API_KEY_HERE');
  });

  test('enables crash reporting', async function (assert) {
    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');
    assert.equal(raygunService.enableCrashReporting, true);
  });

  test('enables pulse', async function (assert) {
    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');
    assert.equal(raygunService.enablePulse, true);
  });

  test('does nothing if crash reporting is disabled', async function (assert) {
    let config = getOwnConfig().raygunConfig;
    config.enableCrashReporting = false;

    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');

    assert.notOk(raygunService.enableCrashReporting);
    assert.equal(raygunService.apiKey, undefined);
  });

  test('allows passing options', async function (assert) {
    let config = getOwnConfig().raygunConfig;
    config.options = { testOption: true };

    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');

    assert.ok(raygunService.options.testOption);
  });

  // ---------------------------------------------------------------------------
  // NEW: hook installation when crash reporting is disabled
  // ---------------------------------------------------------------------------

  test('does NOT register an RSVP error handler when crash reporting is disabled', async function (assert) {
    getOwnConfig().raygunConfig.enableCrashReporting = false;

    await initialize(this.owner);

    assert.notOk(
      this.rsvpHandlers.some(([evt]) => evt === 'error'),
      'no RSVP "error" handler is added'
    );
  });

  test('does NOT replace applicationInstance.onerror when crash reporting is disabled', async function (assert) {
    getOwnConfig().raygunConfig.enableCrashReporting = false;
    const original = function noopOnError() {};
    this.owner.onerror = original;

    await initialize(this.owner);

    assert.strictEqual(this.owner.onerror, original, 'onerror is left untouched');
  });

  // ---------------------------------------------------------------------------
  // NEW: RSVP unhandled-rejection hook
  // ---------------------------------------------------------------------------

  test('registers an RSVP "error" handler that forwards rejections to raygun.send', async function (assert) {
    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');

    const errorHandlers = this.rsvpHandlers.filter(([evt]) => evt === 'error');
    assert.equal(errorHandlers.length, 1, 'exactly one RSVP error handler registered');

    // Invoke the captured handler directly to verify its body.
    const reason = new Error('unhandled-rejection');
    const [, handler] = errorHandlers[0];
    handler(reason);

    assert.equal(raygunService.calls.length, 1);
    const [type, args] = raygunService.calls[0];
    assert.equal(type, 'send');
    assert.deepEqual(args, [{ error: reason }]);
  });

  // ---------------------------------------------------------------------------
  // NEW: applicationInstance.onerror wrapping
  // ---------------------------------------------------------------------------

  test('wraps applicationInstance.onerror so errors flow to raygun.send', async function (assert) {
    this.owner.onerror = undefined;

    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');

    assert.equal(typeof this.owner.onerror, 'function', 'onerror was assigned');

    const err = new Error('app-error');
    this.owner.onerror(err);

    assert.equal(raygunService.calls.length, 1);
    const [type, args] = raygunService.calls[0];
    assert.equal(type, 'send');
    assert.deepEqual(args, [err]);
  });

  test('preserves a previously-installed applicationInstance.onerror handler', async function (assert) {
    const priorCalls = [];
    const prior = (e) => priorCalls.push(e);
    this.owner.onerror = prior;

    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');

    const err = new Error('chained');
    this.owner.onerror(err);

    assert.deepEqual(priorCalls, [err], 'prior onerror handler was still invoked');
    assert.equal(raygunService.calls.length, 1, 'raygun.send was also invoked');
    assert.deepEqual(raygunService.calls[0], ['send', [err]]);
  });

  // ---------------------------------------------------------------------------
  // NEW: Pulse page-view tracking via router.routeDidChange
  // ---------------------------------------------------------------------------

  test('subscribes to routeDidChange and emits a Pulse pageView event', async function (assert) {
    const router = this.owner.lookup('service:router');
    const handlers = [];
    const origOn = router.on.bind(router);
    router.on = (evt, fn) => {
      handlers.push([evt, fn]);
      return origOn(evt, fn);
    };

    await initialize(this.owner);
    const raygunService = this.owner.lookup('service:raygun');

    const subscribed = handlers.find(([evt]) => evt === 'routeDidChange');
    assert.ok(subscribed, 'a routeDidChange listener was registered');

    // Invoke the captured handler with a synthetic transition.
    const [, handler] = subscribed;
    handler({ to: { name: 'posts.show' } });

    assert.equal(raygunService.calls.length, 1);
    const [type, args] = raygunService.calls[0];
    assert.equal(type, 'trackEvent');
    assert.deepEqual(args, [{ type: 'pageView', path: 'posts.show' }]);
  });

  test('does NOT subscribe to routeDidChange when crash reporting is disabled', async function (assert) {
    getOwnConfig().raygunConfig.enableCrashReporting = false;

    const router = this.owner.lookup('service:router');
    const handlers = [];
    const origOn = router.on.bind(router);
    router.on = (evt, fn) => {
      handlers.push([evt, fn]);
      return origOn(evt, fn);
    };

    await initialize(this.owner);

    assert.notOk(
      handlers.some(([evt]) => evt === 'routeDidChange'),
      'no routeDidChange listener is added'
    );
  });
});
