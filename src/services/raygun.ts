import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

const PREFIX = 'ember-cli-raygun:';

// Loose typing for the raygun4js global. The library accepts many command
// strings with widely varying argument shapes; we don't try to enumerate
// them here.
type Rg4jsFn = (command: string, ...args: unknown[]) => unknown;

function getRg4js(): Rg4jsFn | undefined {
  if (typeof window === 'undefined') return undefined;
  const fn = (window as unknown as { rg4js?: Rg4jsFn }).rg4js;
  return typeof fn === 'function' ? fn : undefined;
}

function warn(message: string): void {
  console.warn(`${PREFIX} ${message}`);
}

export default class RaygunService extends Service {
  @tracked private _apiKey: string | undefined;
  @tracked private _enableCrashReporting: boolean | undefined;
  @tracked private _enablePulse: boolean | undefined;
  @tracked private _options: Record<string, unknown> | undefined;

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
    rg4js('apiKey', value);
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
    rg4js('enableCrashReporting', value);
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
    rg4js('enablePulse', value);
  }

  get options(): Record<string, unknown> | undefined {
    return this._options;
  }
  set options(value: Record<string, unknown> | undefined) {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to set options, rg4js is not available.');
      return;
    }
    this._options = value;
    rg4js('options', value);
  }

  send(...args: unknown[]): unknown {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to send data, rg4js is not available.');
      return null;
    }
    return rg4js('send', ...args);
  }

  setUser(...args: unknown[]): unknown {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to set user, rg4js is not available.');
      return null;
    }
    return rg4js('setUser', ...args);
  }

  trackEvent(...args: unknown[]): unknown {
    const rg4js = getRg4js();
    if (!rg4js) {
      warn('Unable to track event, rg4js is not available.');
      return null;
    }
    return rg4js('trackEvent', ...args);
  }
}
