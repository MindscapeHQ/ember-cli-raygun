/* global rg4js */
import Service from '@ember/service';

export default class RaygunService extends Service {

  _isRaygunAvailable() {
    return typeof rg4js === 'function';
  }

  init() {
    super.init(...arguments);
    if (!this._isRaygunAvailable()) {
      console.warn("ember-cli-raygun: Unable to see rg4js - has the bootstrap script been correctly injected into your <head> section? Check your CSP too!");
      return;
    }
  }

  get apiKey() {
    return this._apiKey;
  }

  set apiKey(newKey) {
    if (this._isRaygunAvailable()) {
      this._apiKey = newKey;
      rg4js('apiKey', newKey);
    } else {
      console.warn("ember-cli-raygun: Unable to set apiKey, rg4js is not available.");
    }
  }

  get enableCrashReporting() {
    return this._enableCrashReporting;
  }

  set enableCrashReporting(value) {
    if (this._isRaygunAvailable()) {
      this._enableCrashReporting = value;
      rg4js('enableCrashReporting', value);
    } else {
      console.warn("ember-cli-raygun: Unable to enable crash reporting, rg4js is not available.");
    }
  }

  get enablePulse() {
    return this._enablePulse;
  }

  set enablePulse(value) {
    if (this._isRaygunAvailable()) {
      this._enablePulse = value;
      rg4js('enablePulse', value);
    } else {
      console.warn("ember-cli-raygun: Unable to enable Pulse, rg4js is not available.");
    }
  }

  send() {
    if (this._isRaygunAvailable()) {
      return rg4js('send', ...arguments);
    } else {
      console.warn("ember-cli-raygun: Unable to send data, rg4js is not available.");
      return null;
    }
  }

  setUser() {
    if (this._isRaygunAvailable()) {
      return rg4js('setUser', ...arguments);
    } else {
      console.warn("ember-cli-raygun: Unable to set user, rg4js is not available.");
      return null;
    }
  }

  trackEvent() {
    if (this._isRaygunAvailable()) {
      return rg4js('trackEvent', ...arguments);
    } else {
      console.warn("ember-cli-raygun: Unable to track event, rg4js is not available.");
      return null;
    }
  }
}
