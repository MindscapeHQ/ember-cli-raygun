import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import { setupRaygun } from '#src/index.ts';

import type ApplicationInstance from '@ember/application/instance';

class MockRaygunService extends Service {
  apiKey: string | undefined;
  enableCrashReporting: boolean | undefined;
  enablePulse: boolean | undefined;
  options: Record<string, unknown> | undefined;

  sent: unknown[] = [];
  tracked: unknown[] = [];

  send(payload: unknown) {
    this.sent.push(payload);
    return null;
  }
  trackEvent(payload: unknown) {
    this.tracked.push(payload);
    return null;
  }
}

interface TestOwner {
  unregister: (name: string) => void;
  register: (name: string, factory: unknown) => void;
}

interface MockRouter {
  on: (event: string, handler: (transition: unknown) => void) => void;
  handlers: Record<string, ((transition: unknown) => void)[]>;
  trigger: (event: string, transition: unknown) => void;
}

function makeMockRouter(): MockRouter {
  const handlers: Record<string, ((transition: unknown) => void)[]> = {};
  return {
    handlers,
    on(event, handler) {
      (handlers[event] = handlers[event] || []).push(handler);
    },
    trigger(event, transition) {
      for (const fn of handlers[event] || []) fn(transition);
    },
  };
}

module('Unit | setupRaygun', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    const owner = this.owner as unknown as TestOwner;
    owner.unregister('service:raygun');
    owner.register('service:raygun', MockRaygunService);
  });

  test('does nothing when crash reporting is disabled', function (assert) {
    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: false,
    });
    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    assert.strictEqual(svc.apiKey, undefined);
    assert.notOk(svc.enableCrashReporting);
  });

  test('configures the service when enabled', function (assert) {
    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: true,
      enablePulse: true,
      options: { allowInsecureSubmissions: true },
      trackPageViews: false,
    });
    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    assert.strictEqual(svc.apiKey, 'KEY');
    assert.true(svc.enableCrashReporting);
    assert.true(svc.enablePulse);
    assert.deepEqual(svc.options, { allowInsecureSubmissions: true });
  });

  test('enablePulse defaults to true when omitted', function (assert) {
    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: true,
      trackPageViews: false,
    });
    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    assert.true(svc.enablePulse);
  });

  test('enablePulse: false is honoured', function (assert) {
    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: true,
      enablePulse: false,
      trackPageViews: false,
    });
    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    assert.false(svc.enablePulse);
  });

  test('options is left untouched when not provided', function (assert) {
    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: true,
      trackPageViews: false,
    });
    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    assert.strictEqual(svc.options, undefined);
  });

  test('warns and returns when service:raygun is not registered', function (assert) {
    const fakeAppInstance = {
      lookup: () => undefined,
    } as unknown as ApplicationInstance;
    const originalWarn = console.warn;
    const warnings: unknown[][] = [];
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      setupRaygun(fakeAppInstance, {
        apiKey: 'KEY',
        enableCrashReporting: true,
        trackPageViews: false,
      });
    } finally {
      console.warn = originalWarn;
    }
    const ours = warnings.filter((w) =>
      String(w[0]).includes('service:raygun was not found'),
    );
    assert.strictEqual(ours.length, 1, 'one matching warning');
  });

  test('forwards unhandled native promise rejections to raygun.send', function (assert) {
    const original = window.addEventListener.bind(window);
    let captured: ((event: PromiseRejectionEvent) => void) | undefined;
    window.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      ...rest: unknown[]
    ) {
      if (type === 'unhandledrejection' && typeof listener === 'function') {
        captured = listener;
        return;
      }
      return (original as unknown as (...args: unknown[]) => void)(
        type,
        listener,
        ...rest,
      );
    } as typeof window.addEventListener;

    try {
      setupRaygun(this.owner as unknown as ApplicationInstance, {
        apiKey: 'KEY',
        enableCrashReporting: true,
        trackPageViews: false,
      });
    } finally {
      window.addEventListener = original;
    }

    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    const reason = new Error('rejected');
    assert.ok(captured, 'an unhandledrejection listener was registered');
    captured!({ reason } as PromiseRejectionEvent);

    assert.deepEqual(svc.sent.pop(), { error: reason });
  });

  test('wraps appInstance.onerror, chaining any pre-existing handler', function (assert) {
    const calls: string[] = [];
    const inst = this.owner as unknown as {
      onerror?: (e: Error) => void;
    } & ApplicationInstance;
    inst.onerror = (e: Error) => calls.push(`prev:${e.message}`);

    setupRaygun(inst, {
      apiKey: 'KEY',
      enableCrashReporting: true,
      trackPageViews: false,
    });

    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    const err = new Error('boom');
    inst.onerror(err);

    assert.deepEqual(calls, ['prev:boom'], 'pre-existing handler ran first');
    assert.deepEqual(svc.sent, [err], 'error was forwarded to raygun.send');
  });

  test('subscribes to routeDidChange and emits pageView trackEvents', function (assert) {
    const router = makeMockRouter();
    const owner = this.owner as unknown as TestOwner;
    owner.register(
      'service:router',
      class extends Service {
        on = router.on.bind(router);
      },
    );

    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: true,
    });

    router.trigger('routeDidChange', { to: { name: 'posts.show' } });
    router.trigger('routeDidChange', { to: { name: 'index' } });

    const svc = this.owner.lookup('service:raygun') as MockRaygunService;
    assert.deepEqual(svc.tracked, [
      { type: 'pageView', path: 'posts.show' },
      { type: 'pageView', path: 'index' },
    ]);
  });

  test('trackPageViews: false skips router subscription', function (assert) {
    const router = makeMockRouter();
    const owner = this.owner as unknown as TestOwner;
    owner.register(
      'service:router',
      class extends Service {
        on = router.on.bind(router);
      },
    );

    setupRaygun(this.owner as unknown as ApplicationInstance, {
      apiKey: 'KEY',
      enableCrashReporting: true,
      trackPageViews: false,
    });

    assert.strictEqual(
      (router.handlers['routeDidChange'] || []).length,
      0,
      'no routeDidChange handler was registered',
    );
  });
});
