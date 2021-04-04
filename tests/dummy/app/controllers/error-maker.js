/* global rg4js */
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { Promise } from 'rsvp';
import EmberError from '@ember/error';
import { inject as service } from '@ember/service';

export default class ErrorMakerController extends Controller {

  @service raygun;

  @tracked raygunEvents = []

  @tracked userId
  @tracked userEmail
  @tracked userName

  init() {
    super.init(...arguments)

    rg4js('onBeforeSend', (payload) => {
      this.raygunEvents = [ JSON.stringify(payload), ...this.raygunEvents ]

      // If you're sing the default/test api key - don't actually send to Raygun :)
      return false;
      // use this to actually send if you want to test with a live API key
      // return payload;
    });
  }

  get userData() {
    if (!this.userId) return "(Choose an ID to set Raygun user data)";

    let data = {
      identifier: this.userId,
      email: this.userEmail,
      fullName: this.userName
    }
    this.raygun.setUser(data);
    return JSON.stringify(data);
  } 

  @action
  regularError() {
    throw new Error("This is an error we're not even going to catch!")
  }
  
  @action
  emberError() {
    throw new EmberError("This is an ember error we won't catch")
  }

  @action 
  uncaughtPromise() {
    new Promise((_, reject) => {
      reject("Always going to be rejected!")
    })
  }

  @action manualReport() {
    rg4js('send', new Error('I am manually telling Raygun about this'));
  }

}
