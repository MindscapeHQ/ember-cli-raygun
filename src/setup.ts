import RaygunService from './services/raygun.ts';

import type ApplicationInstance from '@ember/application/instance';
import type RouterService from '@ember/routing/router-service';
import type { RaygunOptions } from 'raygun4js';

type ApplicationInstanceWithOnError = ApplicationInstance & {
  onerror?: (error: Error) => void;
};

export interface RaygunConfig {
  /** Your Raygun API key. Required when `enableCrashReporting` is true. */
  apiKey: string;
  /**
   * Master switch. When false, `setupRaygun` is a no-op (no listeners are
   * attached, no calls to rg4js are made). The build-time `<head>` loader
   * is also skipped when this is false in the host's `config/environment.js`.
   */
  enableCrashReporting: boolean;
  /** Toggle Raygun Pulse (Real User Monitoring). Defaults to true. */
  enablePulse?: boolean;
  /** Forwarded to `rg4js('options', …)`. See raygun4js docs. */
  options?: RaygunOptions;
  /**
   * Track route changes as Pulse `pageView` events. Defaults to true.
   * Set false to opt out (or to wire your own analytics layer).
   */
  trackPageViews?: boolean;
}

/**
 * Wires Raygun into the application instance.
 *
 * Call this once from your application's startup code — for example from your
 * own `instance-initializers/raygun.js`, or directly in `app/app.js` after the
 * Application instance is created. See the README for the recommended pattern.
 *
 * Idempotent: the `enableCrashReporting: false` early-out makes it safe to
 * call unconditionally with environment-driven config.
 */
export function setupRaygun(
  appInstance: ApplicationInstance,
  config: RaygunConfig,
): void {
  if (!config || !config.enableCrashReporting) {
    return;
  }

  const raygunService = appInstance.lookup('service:raygun') as
    | RaygunService
    | undefined;

  if (!raygunService) {
    console.warn(
      'ember-cli-raygun: service:raygun was not found in the container. ' +
        'Make sure the addon is installed and the resolver is picking it up.',
    );
    return;
  }

  raygunService.apiKey = config.apiKey;
  raygunService.enableCrashReporting = true;
  raygunService.enablePulse = config.enablePulse !== false;

  if (config.options) {
    raygunService.options = config.options;
  }

  // Unhandled native promise rejections.
  // https://developer.mozilla.org/docs/Web/API/Window/unhandledrejection_event
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function'
  ) {
    window.addEventListener('unhandledrejection', (event) => {
      raygunService.send({ error: event.reason as unknown });
    });
  }

  // Compose, don't replace, any pre-existing onerror handler.
  const inst = appInstance as ApplicationInstanceWithOnError;
  const existingOnError = inst.onerror;
  inst.onerror = function (error: Error) {
    if (existingOnError) existingOnError(error);
    raygunService.send(error);
  };

  if (config.trackPageViews !== false) {
    const router = appInstance.lookup('service:router') as
      | RouterService
      | undefined;
    if (router) {
      router.on('routeDidChange', (transition) => {
        raygunService.trackEvent({
          type: 'pageView',
          path: transition.to?.name ?? '',
        });
      });
    }
  }
}
