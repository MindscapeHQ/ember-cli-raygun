import { LinkTo } from '@ember/routing';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import type { RaygunService } from '#src/index.ts';
import type Owner from '@ember/owner';

// Raygun payloads include circular refs and Error instances; serialize safely.
function safeReplacer() {
  const seen = new WeakSet<object>();
  return (_key: string, value: unknown) => {
    if (value instanceof Error) {
      return { name: value.name, message: value.message, stack: value.stack };
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  };
}

class ErrorMaker extends Component {
  @service declare raygun: RaygunService;
  @tracked raygunEvents: string[] = [];

  @tracked userId = '';
  @tracked userEmail = '';
  @tracked userName = '';
  @tracked submittedUserData = '';

  constructor(owner: Owner, args: object) {
    super(owner, args);
    if (typeof window === 'undefined' || typeof window.rg4js !== 'function') {
      return;
    }
    window.rg4js('onBeforeSend', (payload: unknown) => {
      let serialized: string;
      try {
        serialized = JSON.stringify(payload, safeReplacer(), 2);
      } catch (e) {
        serialized = `[unserializable payload: ${(e as Error).message}]`;
      }
      this.raygunEvents = [serialized, ...this.raygunEvents];
      // If you're using the placeholder API key — don't actually send to Raygun.
      return false;
      // To actually send with a live API key, return the payload instead.
      // return payload;
    });
  }

  get userData(): string {
    return (
      this.submittedUserData || '(Submit the form to set Raygun user data)'
    );
  }

  submitUser = (e: Event) => {
    e.preventDefault();
    if (!this.userId) {
      this.submittedUserData = '';
      return;
    }
    const data = {
      identifier: this.userId,
      email: this.userEmail,
      fullName: this.userName,
    };
    this.raygun.setUser(data);
    this.submittedUserData = JSON.stringify(data);
  };

  updateId = (e: Event) => {
    this.userId = (e.target as HTMLInputElement).value;
  };
  updateEmail = (e: Event) => {
    this.userEmail = (e.target as HTMLInputElement).value;
  };
  updateName = (e: Event) => {
    this.userName = (e.target as HTMLInputElement).value;
  };

  regularError = () => {
    throw new Error("This is an error we're not even going to catch!");
  };

  emberError = () => {
    // `@ember/error` is removed in modern Ember; a plain Error suffices.
    throw new Error("This is an ember error we won't catch");
  };

  uncaughtPromise = () => {
    void new Promise((_resolve, reject) => {
      reject(new Error('Always going to be rejected!'));
    });
  };

  manualReport = () => {
    if (typeof window !== 'undefined' && typeof window.rg4js === 'function') {
      window.rg4js(
        'send',
        new Error('I am manually telling Raygun about this'),
      );
    }
  };

  <template>
    <h5 data-test-user-identity-heading>User identity</h5>
    <form class="user-form" data-test-user-form {{on "submit" this.submitUser}}>
      <label>
        ID
        <input
          type="text"
          value={{this.userId}}
          data-test-user-id
          {{on "input" this.updateId}}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={{this.userEmail}}
          data-test-user-email
          {{on "input" this.updateEmail}}
        />
      </label>
      <label>
        Name
        <input
          type="text"
          value={{this.userName}}
          data-test-user-name
          {{on "input" this.updateName}}
        />
      </label>
      <button type="submit" data-test-button="set-user">Set user</button>
    </form>

    <pre data-test-user-data>{{this.userData}}</pre>

    <hr />

    <button
      type="button"
      data-test-button="regular-error"
      {{on "click" this.regularError}}
    >
      Regular ol' error
    </button>

    <button
      type="button"
      data-test-button="ember-error"
      {{on "click" this.emberError}}
    >
      Ember error
    </button>

    <button
      type="button"
      data-test-button="uncaught-promise"
      {{on "click" this.uncaughtPromise}}
    >
      Uncaught promise rejection
    </button>

    <button
      type="button"
      class="manual-report"
      data-test-button="manual-report"
      {{on "click" this.manualReport}}
    >
      Manually Report
    </button>

    <LinkTo @route="other-one" data-test-link="other-one">Another route</LinkTo>

    <h5 data-test-events-heading>What have we sent to Raygun?</h5>
    {{#if this.raygunEvents.length}}
      {{#each this.raygunEvents as |e|}}
        <pre data-test-event>{{e}}</pre>
        <hr />
      {{/each}}

      Sent to Raygun:
      <span class="event-count" data-test-event-count>
        {{this.raygunEvents.length}}
      </span>
    {{else}}
      <span data-test-empty-state>Nothing yet…</span>
    {{/if}}
  </template>
}

<template><ErrorMaker /></template>
