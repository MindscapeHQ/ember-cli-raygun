import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type { RaygunOptions, RaygunV2, RaygunV2UserDetails } from 'raygun4js';

const PREFIX = 'ember-cli-raygun:';

function getRg4js(): RaygunV2 | undefined {
  if (typeof window === 'undefined') return undefined;
  const fn = window.rg4js;
  return typeof fn === 'function' ? fn : undefined;
}

function warn(message: string): void {
  console.warn(`${PREFIX} ${message}`);
}

export default class RaygunService extends Service {
  @tracked private _apiKey: string | undefined;
  @tracked private _enableCrashReporting: boolean | undefined;
  @tracked private _enablePulse: boolean | undefined;
  @tracked private _options: RaygunOptions | undefined;

  get apiKey(): string | undefined {
    return this._apiKey;
  }
  set apiKey(value: string | undefined) {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to set apiKey, rg4js is not available.');
      return;
    }
    this._apiKey = value;
    rg4js('apiKey', value ?? '');
  }

  get enableCrashReporting(): boolean | undefined {
    return this._enableCrashReporting;
  }
  set enableCrashReporting(value: boolean | undefined) {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to enable crash reporting, rg4js is not available.');
      return;
    }
    this._enableCrashReporting = value;
    rg4js('enableCrashReporting', value ?? false);
  }

  get enablePulse(): boolean | undefined {
    return this._enablePulse;
  }
  set enablePulse(value: boolean | undefined) {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to enable Pulse, rg4js is not available.');
      return;
    }
    this._enablePulse = value;
    rg4js('enablePulse', value ?? false);
  }

  get options(): RaygunOptions | undefined {
    return this._options;
  }
  set options(value: RaygunOptions | undefined) {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to set options, rg4js is not available.');
      return;
    }
    this._options = value;
    rg4js('options', value ?? {});
  }

  send(error: Error | { error: unknown }): void {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to send data, rg4js is not available.');
      return;
    }
    rg4js('send', error);
  }

  setUser(user: RaygunV2UserDetails): void {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to set user, rg4js is not available.');
      return;
    }
    rg4js('setUser', user);
  }

  trackEvent(
    event:
      | { type: 'pageView'; path: string }
      | { type: 'customTiming'; name: string; duration: number },
  ): void {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to track event, rg4js is not available.');
      return;
    }
    rg4js('trackEvent', event);
  }
}
