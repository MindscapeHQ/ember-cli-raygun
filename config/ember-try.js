'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = async function () {
  return {
    scenarios: [
      {
        name: 'ember-lts-4.4.5',
        npm: {
          devDependencies: {
            'ember-source': '~4.4.5'
          }
        }
      },
      {
        name: 'ember-lts-4.8.6',
        npm: {
          devDependencies: {
            'ember-source': '~4.8.6'
          }
        }
      },
      {
        name: 'ember-lts-4.12.3',
        npm: {
          devDependencies: {
            'ember-source': '~4.12.3'
          }
        }
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release')
          }
        }
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta')
          }
        }
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary')
          }
        }
      },
      // The 'ember-classic' scenario was removed: the Ember Classic edition
      // was removed from Ember itself, so the scenario can never pass on a
      // modern Ember version. See deprecations.emberjs.com/v3.x/#toc_editions-classic
      //
      // The 'ember-default-with-jquery' scenario was also removed: the
      // 'jquery-integration' optional feature was removed in Ember 4.0.
      // See deprecations.emberjs.com/v3.x/#toc_optional-feature-jquery-integration
    ]
  };
};
