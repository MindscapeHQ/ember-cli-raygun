import defaultConfig from '../config/environment';

import initializeWithDefaultConfig from 'ember-cli-raygun/initializers/ember-cli-raygun';

export function initializeWithConfig(passedConfig) {
  return initializeWithDefaultConfig(passedConfig);
}

export default {
  name: 'ember-cli-raygun',
  initialize() {
    return initializeWithDefaultConfig(defaultConfig);
  }
};
