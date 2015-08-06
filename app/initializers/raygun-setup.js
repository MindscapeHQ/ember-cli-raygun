import Ember from "ember";
import config from "../config/environment";

export function initialize(container, application) {

  if (!config.raygun) {
    console.log("Please set your Raygun config in environment.js");
    return;
  }

  var loggingEnvironments = config.raygun.loggingEnvironments || ["production"];

  if (loggingEnvironments.indexOf(config.environment) === -1) {
    console.log("Skipping Raygun registration because loggingEnvironment=", loggingEnvironments, "and config.environment=", config.environment);
    return;
  }

  var apiKey = config.raygun.apiKey;
  Raygun.init(apiKey, config.raygun).attach().setVersion(application.version);

  Ember.onerror = function (error) {
    Raygun.send(error);
  };
   
  Ember.RSVP.on('error', function(error) {
    Raygun.send(error);
  });
  
  var defaultErrorHandler = Ember.Logger.error;

  Ember.Logger.error = function (message, cause, stack) {
    defaultErrorHandler(message, cause, stack);
    Raygun.send(new Error(message + " (" + cause + ")"), null, { 
      cause: cause, 
      stack: stack
    });
  }

  return true;

}

export default {
  name: 'raygun-setup',
  initialize: initialize
};

