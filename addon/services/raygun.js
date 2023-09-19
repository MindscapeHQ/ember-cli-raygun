/* global rg4js */
import Service from '@ember/service';

export default class RaygunService extends Service {

  init() {
    super.init(...arguments);
    if (typeof rg4js !== "function") {
      console.warn("ember-cli-raygun: Unable to see raygun4js - has the bootstrap script been correctly injected into your <head> section? Check your CSP too!")
      return
    }
  }

  get apiKey() {
    return this._apiKey;
  }

  set apiKey(newKey) {
    this._apiKey = newKey;
    rg4js('apiKey', newKey)
  }

  get enableCrashReporting() {
    return this._enableCrashReporting;
  }

  set enableCrashReporting(value) {
    rg4js('enableCrashReporting', value);
    this._enableCrashReporting = value;
  }

  get enablePulse() {
    return this._enablePulse;
  }

  set enablePulse(value) {
    rg4js('enablePulse', value);
    this._enablePulse = value;
  }

  send() {
    return rg4js('send', ...arguments);
  }

  setUser() {
    return rg4js('setUser', ...arguments);
  }

  trackEvent() {
    return rg4js('trackEvent', ...arguments);
  }

}
