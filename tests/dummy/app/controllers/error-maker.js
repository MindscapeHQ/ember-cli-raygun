/* global rg4js */
import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { Promise } from 'rsvp';
import EmberError from '@ember/error';

export default class ErrorMakerController extends Controller {

  @tracked raygunEvents = []

  init() {
    super.init(...arguments)

    rg4js('onBeforeSend', (payload) => {
      this.raygunEvents = [ JSON.stringify(payload), ...this.raygunEvents ]
      return false; // don't actually try to connect
      // return payload; // use this to actually send if you want to test with a live API key
    });    
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
