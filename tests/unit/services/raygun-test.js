import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | raygun', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.oldRaygun = window.rg4js;
    this.raygunCalls = [];
    window.rg4js = (type, ...args) => {
      this.raygunCalls.push([type, args]);
    };
  })

  hooks.afterEach(function() {
    window.rg4js = this.oldRaygun;
    this.raygunCalls = [];
  });

  test('it exists', function(assert) {
    let service = this.owner.lookup('service:raygun');   
    assert.ok(service);
  });

  test('tracking an event', function(assert) {
    let raygunService = this.owner.lookup('service:raygun');

    raygunService.trackEvent({
      type: 'testEvent'
    })
    const [ latestCallType, latestCallArgs ] = this.raygunCalls.pop();
    assert.equal('trackEvent', latestCallType);
    assert.deepEqual([{ type: 'testEvent'}], latestCallArgs);
  })

  test('sending an error', function (assert) {
    let raygunService = this.owner.lookup('service:raygun');

    raygunService.send(new Error('e'))
    const [latestCallType, latestCallArgs] = this.raygunCalls.pop();
    assert.equal('send', latestCallType);
    assert.deepEqual([new Error('e')], latestCallArgs);
  })

});
