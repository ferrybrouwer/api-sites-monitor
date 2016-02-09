(function () {
  'use strict';

  // increase event listeners to 100
  require('events').EventEmitter.prototype._maxListeners = 100;

  // set process test environment
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.TEST_ENV = process.env.TEST_ENV || 'test';

  // add node globals variables
  global.mocks = require('./mock.json');
  global.lt = require('loopback-testing');
  global.chai = require('chai');
  global.app = require('../server/server');
  global.request = require('supertest')(app);
  global.async = require('async');
  global._ = require('lodash');
  global.assert = global.chai.assert;
  global.expect = global.chai.expect;

})();
