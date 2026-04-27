import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import type { RaygunService } from '#src/index.ts';

interface RaygunCall {
  type: string;
  args: unknown[];
}

module('Unit | Service | raygun', function (hooks) {
  setupTest(hooks);

  let calls: RaygunCall[];
  let originalRg4js: typeof window.rg4js;

  hooks.beforeEach(function () {
    originalRg4js = window.rg4js;
    calls = [];
    window.rg4js = (type: string, ...args: unknown[]) => {
      calls.push({ type, args });
    };
  });

  hooks.afterEach(function () {
    window.rg4js = originalRg4js;
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    assert.ok(service);
  });

  test('setting apiKey forwards to rg4js and round-trips', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    service.apiKey = 'TEST_KEY';
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'apiKey');
    assert.deepEqual(last.args, ['TEST_KEY']);
    assert.strictEqual(service.apiKey, 'TEST_KEY');
  });

  test('setting enableCrashReporting forwards to rg4js and round-trips', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    service.enableCrashReporting = true;
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'enableCrashReporting');
    assert.deepEqual(last.args, [true]);
    assert.true(service.enableCrashReporting);
  });

  test('setting enablePulse forwards to rg4js and round-trips', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    service.enablePulse = true;
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'enablePulse');
    assert.deepEqual(last.args, [true]);
    assert.true(service.enablePulse);
  });

  test('setting options forwards to rg4js and round-trips', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    service.options = { allowInsecureSubmissions: true };
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'options');
    assert.deepEqual(last.args, [{ allowInsecureSubmissions: true }]);
    assert.deepEqual(service.options, { allowInsecureSubmissions: true });
  });

  test('trackEvent forwards to rg4js', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    service.trackEvent({ type: 'pageView', path: '/foo' });
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'trackEvent');
    assert.deepEqual(last.args, [{ type: 'pageView', path: '/foo' }]);
  });

  test('send forwards to rg4js', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    const err = new Error('e');
    service.send(err);
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'send');
    assert.deepEqual(last.args, [err]);
  });

  test('setUser forwards to rg4js', function (assert) {
    const service = this.owner.lookup('service:raygun') as RaygunService;
    const user = { identifier: 'u1', email: 'a@b.com', fullName: 'Ada' };
    service.setUser(user);
    const last = calls.pop()!;
    assert.strictEqual(last.type, 'setUser');
    assert.deepEqual(last.args, [user]);
  });

  test('falls back gracefully when rg4js is missing', function (assert) {
    window.rg4js = undefined;
    const service = this.owner.lookup('service:raygun') as RaygunService;
    assert.strictEqual(service.send(new Error('x')), null);
    assert.strictEqual(service.setUser({ identifier: 'a' }), null);
    assert.strictEqual(service.trackEvent({ type: 'pageView' }), null);
    // Setters bail out without throwing and without storing the value.
    service.apiKey = 'IGNORED';
    service.enableCrashReporting = true;
    service.enablePulse = true;
    service.options = { foo: 1 };
    assert.strictEqual(service.apiKey, undefined);
    assert.strictEqual(service.enableCrashReporting, undefined);
    assert.strictEqual(service.enablePulse, undefined);
    assert.strictEqual(service.options, undefined);
  });
});
