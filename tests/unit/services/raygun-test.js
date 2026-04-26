import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | raygun', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.oldRaygun = window.rg4js;
    this.oldWarn = console.warn;
    this.warnings = [];
    console.warn = (...args) => {
      this.warnings.push(args.join(' '));
    };
    this.raygunCalls = [];
    window.rg4js = (type, ...args) => {
      this.raygunCalls.push([type, args]);
    };
  });

  hooks.afterEach(function () {
    window.rg4js = this.oldRaygun;
    console.warn = this.oldWarn;
    this.raygunCalls = [];
    this.warnings = [];
  });

  test('it exists', function (assert) {
    let service = this.owner.lookup('service:raygun');
    assert.ok(service);
  });

  // ---------------------------------------------------------------------------
  // Method forwarding
  // ---------------------------------------------------------------------------

  test('trackEvent forwards arguments to rg4js', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    raygunService.trackEvent({ type: 'testEvent' });

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'trackEvent');
    assert.deepEqual(args, [{ type: 'testEvent' }]);
  });

  test('send forwards an Error to rg4js', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    const err = new Error('boom');
    raygunService.send(err);

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'send');
    assert.deepEqual(args, [err]);
  });

  test('setUser forwards user payload to rg4js', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    const user = {
      identifier: 'user-1',
      isAnonymous: false,
      email: 'a@example.com',
      fullName: 'A B',
    };
    raygunService.setUser(user);

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'setUser');
    assert.deepEqual(args, [user]);
  });

  test('trackEvent supports pageView shape', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    raygunService.trackEvent({ type: 'pageView', path: 'posts.show' });

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'trackEvent');
    assert.deepEqual(args, [{ type: 'pageView', path: 'posts.show' }]);
  });

  // ---------------------------------------------------------------------------
  // Property setters round-trip through rg4js
  // ---------------------------------------------------------------------------

  test('apiKey setter forwards to rg4js and getter returns the stored value', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    raygunService.apiKey = 'KEY-123';

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'apiKey');
    assert.deepEqual(args, ['KEY-123']);
    assert.equal(raygunService.apiKey, 'KEY-123');
  });

  test('enableCrashReporting setter forwards to rg4js and round-trips', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    raygunService.enableCrashReporting = true;

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'enableCrashReporting');
    assert.deepEqual(args, [true]);
    assert.equal(raygunService.enableCrashReporting, true);
  });

  test('enablePulse setter forwards to rg4js and round-trips', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');
    raygunService.enablePulse = true;

    const [type, args] = this.raygunCalls.pop();
    assert.equal(type, 'enablePulse');
    assert.deepEqual(args, [true]);
    assert.equal(raygunService.enablePulse, true);
  });

  // ---------------------------------------------------------------------------
  // Graceful degradation when rg4js is missing
  // ---------------------------------------------------------------------------

  module('when rg4js is unavailable (CDN blocked / CSP)', function (innerHooks) {
    innerHooks.beforeEach(function () {
      // Force-remove the global so the service's _isRaygunAvailable() guard returns false.
      window.rg4js = undefined;
    });

    test('send returns null and warns instead of throwing', function (assert) {
      let raygunService = this.owner.lookup('service:raygun');
      const result = raygunService.send(new Error('e'));

      assert.strictEqual(result, null, 'send returns null when rg4js missing');
      assert.ok(
        this.warnings.some((w) => w.includes('Unable to send data')),
        'emits a console.warn explaining the failure'
      );
    });

    test('trackEvent returns null and warns', function (assert) {
      let raygunService = this.owner.lookup('service:raygun');
      const result = raygunService.trackEvent({ type: 'pageView' });

      assert.strictEqual(result, null);
      assert.ok(this.warnings.some((w) => w.includes('Unable to track event')));
    });

    test('setUser returns null and warns', function (assert) {
      let raygunService = this.owner.lookup('service:raygun');
      const result = raygunService.setUser({ identifier: 'x' });

      assert.strictEqual(result, null);
      assert.ok(this.warnings.some((w) => w.includes('Unable to set user')));
    });

    // NOTE: We can't assert the underlying _value is unset, because the
    // dummy app's instance initializer pre-populates the service before
    // these tests run. Instead we verify the setter is a no-op against the
    // rg4js spy and that it emits the expected warning.

    test('apiKey setter does not throw and warns', function (assert) {
      let raygunService = this.owner.lookup('service:raygun');
      this.raygunCalls.length = 0;
      this.warnings.length = 0;

      raygunService.apiKey = 'KEY-X';

      assert.equal(this.raygunCalls.length, 0, 'no rg4js call is made');
      assert.ok(this.warnings.some((w) => w.includes('Unable to set apiKey')));
    });

    test('enableCrashReporting setter does not throw and warns', function (assert) {
      let raygunService = this.owner.lookup('service:raygun');
      this.raygunCalls.length = 0;
      this.warnings.length = 0;

      raygunService.enableCrashReporting = false;

      assert.equal(this.raygunCalls.length, 0, 'no rg4js call is made');
      assert.ok(this.warnings.some((w) => w.includes('Unable to enable crash reporting')));
    });

    test('enablePulse setter does not throw and warns', function (assert) {
      let raygunService = this.owner.lookup('service:raygun');
      this.raygunCalls.length = 0;
      this.warnings.length = 0;

      raygunService.enablePulse = false;

      assert.equal(this.raygunCalls.length, 0, 'no rg4js call is made');
      assert.ok(this.warnings.some((w) => w.includes('Unable to enable Pulse')));
    });
  });
});
