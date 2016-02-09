'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/Site.js
 *
 * @global {object}   app           LoopBack Server / Express Server
 * @global {object}   lt            loopback-testing
 * @global {object}   expect        expect
 * @global {object}   assert        assert
 * @global {function} request       supertest
 * @global {function} async         async
 * @global {object}   helper
 */

var database = require('../../database'),
helper       = require('../../helper'),
loopback     = require('loopback');

var models = app.models,
    Model  = models.Site;


describe('common.models.Site', function () {

  /**
   * Clear database before each test
   */
  beforeEach(function (done) {
    app.datasources[database.datasource.name].automigrate(done);
  });

  /**
   * Static method `create`
   * Tests for check if instance is created successfully
   */
  lt.describe.staticMethod('create', function () {
    it('should give an ValidationError `url` presence when property `url` is not provided', function (done) {
      Model.create({}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.url[0]', 'presence');
        done();
      });
    });

    it('should give an ValidationError `name` presence when property `name` is not provided', function (done) {
      Model.create({url: 'http://www.domain.nl'}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.name[0]', 'presence');
        done();
      });
    });

    it('should create instance when `url` and `name` properties are set', function (done) {
      Model.create({
        url:  'http://www.domain.nl',
        name: 'Test Site'
      }, function (err, site) {
        expect(site).to.be.an.instanceof(Model);
        expect(site.toObject()).to.include.keys(['url', 'name', 'id']);
        done();
      });
    });
  });

  /**
   * Static method `delete`
   * Tests for check if instance is deleted successfully
   */
  lt.describe.staticMethod('delete', function () {
    beforeEach(function (done) {
      var self = this;
      helper.createSiteTest({customData: {test: 'test string'}})
        .then(function (sitetest) {
          self.sitetest = sitetest;
          done();
        }).fail(done).done();
    });

    it('should delete all attached Model instances', function (done) {
      Model.destroyById(this.sitetest.siteId, function (err) {
        if (err) return done(err);
        models.SiteTest.find({}, function (err, sitetests) {
          if (err) return done(err);
          expect(sitetests).to.be.an('array').that.have.length(0);
          models.SiteForm.find({}, function (err, siteforms) {
            if (err) return done(err);
            expect(siteforms).to.be.an('array').that.have.length(0);
            done();
          });
        });
      });
    });
  });

});


