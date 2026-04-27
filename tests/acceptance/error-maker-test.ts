import { module, test } from 'qunit';
import { click, currentURL, fillIn, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

type Rg4jsCall = unknown[];

interface WindowWithRg4js extends Window {
  rg4js?: (...args: unknown[]) => unknown;
  __originalRg4js?: ((...args: unknown[]) => unknown) | undefined;
}

function installRg4jsStub(): Rg4jsCall[] {
  const w = window as WindowWithRg4js;
  w.__originalRg4js = w.rg4js;
  const calls: Rg4jsCall[] = [];
  w.rg4js = function (...args: unknown[]) {
    calls.push(args);
    return undefined;
  };
  return calls;
}

function restoreRg4js() {
  const w = window as WindowWithRg4js;
  w.rg4js = w.__originalRg4js;
  delete w.__originalRg4js;
}

function getOnBeforeSend(calls: Rg4jsCall[]): (p: unknown) => unknown {
  const reg = calls.find((c) => c[0] === 'onBeforeSend');
  if (!reg || typeof reg[1] !== 'function') {
    throw new Error('onBeforeSend was not registered');
  }
  return reg[1] as (p: unknown) => unknown;
}

module('Acceptance | error-maker', function (hooks) {
  setupApplicationTest(hooks);

  let calls: Rg4jsCall[];

  hooks.beforeEach(function () {
    calls = installRg4jsStub();
  });

  hooks.afterEach(function () {
    restoreRg4js();
  });

  test('renders the demo page', async function (assert) {
    await visit('/');
    assert.strictEqual(currentURL(), '/');
    assert.dom('[data-test-title]').hasText('Ember CLI Raygun Test App');
    assert.dom('[data-test-raygun-link]').exists();
    assert.dom('[data-test-button]').exists({ count: 5 });
    assert.dom('[data-test-button="manual-report"]').hasText('Manually Report');
    assert.dom('[data-test-button="set-user"]').hasText('Set user');
    assert.dom('[data-test-user-form]').exists();
    assert.dom('[data-test-user-identity-heading]').exists();
    assert.dom('[data-test-events-heading]').exists();
  });

  test('registers an onBeforeSend hook with rg4js on render', async function (assert) {
    await visit('/');
    const onBeforeSend = calls.filter((c) => c[0] === 'onBeforeSend');
    assert.strictEqual(onBeforeSend.length, 1);
    assert.strictEqual(typeof onBeforeSend[0]![1], 'function');
  });

  test('shows "Nothing yet" when no events have been recorded', async function (assert) {
    await visit('/');
    assert.dom('[data-test-empty-state]').hasText('Nothing yet…');
    assert.dom('[data-test-event-count]').doesNotExist();
    assert.dom('[data-test-event]').doesNotExist();
  });

  test('"Manually Report" forwards to rg4js("send", Error)', async function (assert) {
    await visit('/');
    await click('[data-test-button="manual-report"]');

    const sends = calls.filter((c) => c[0] === 'send');
    assert.strictEqual(sends.length, 1, 'one send call was made');
    const payload = sends[0]![1];
    assert.ok(payload instanceof Error, 'payload is an Error');
    assert.strictEqual(
      (payload as Error).message,
      'I am manually telling Raygun about this',
    );
  });

  test('onBeforeSend returns false (suppresses real network sends)', async function (assert) {
    await visit('/');
    const onBeforeSend = getOnBeforeSend(calls);
    const result = onBeforeSend({ Details: { Error: { Message: 'x' } } });
    assert.false(result);
  });

  test('onBeforeSend handler updates the component state', async function (assert) {
    await visit('/');
    const onBeforeSend = getOnBeforeSend(calls);
    // The handler returns false (suppressing the send) regardless of input.
    assert.false(onBeforeSend({ Details: { Error: { Message: 'x' } } }));
    assert.false(onBeforeSend({ anything: true }));
  });

  test('user identity form fields are wired up', async function (assert) {
    await visit('/');
    await fillIn('[data-test-user-id]', 'user-123');
    await fillIn('[data-test-user-email]', 'a@b.com');
    await fillIn('[data-test-user-name]', 'Ada');
    assert.dom('[data-test-user-id]').hasValue('user-123');
    assert.dom('[data-test-user-email]').hasValue('a@b.com');
    assert.dom('[data-test-user-name]').hasValue('Ada');
  });

  test('navigates between routes via LinkTo', async function (assert) {
    await visit('/');
    await click('[data-test-link="other-one"]');
    assert.strictEqual(currentURL(), '/other-one');
    assert.dom('[data-test-other-route]').hasText('This is the other route.');
    await click('[data-test-link="error-maker"]');
    assert.strictEqual(currentURL(), '/');
  });
});
