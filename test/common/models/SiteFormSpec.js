'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/SiteForm.js
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
    Model  = models.SiteForm;


describe('common.models.SiteForm', function () {

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
    it('should give an ValidationError `formPath` presence when property `formPath` is not provided', function (done) {
      Model.create({}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.formPath[0]', 'presence');
        done();
      });
    });

    it('should give an ValidationError `url` presence when property `url` is not provided', function (done) {
      Model.create({formPath: '/path/to/form'}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.url[0]', 'presence');
        done();
      });
    });

    it('should create instance when `formPath` and `url` properties are set', function (done) {
      Model.create({
        formPath: '/path/to/form',
        url:      '/www.domain.nl'
      }, function (err, siteform) {
        expect(siteform).to.be.an.instanceof(Model);
        expect(siteform.toObject()).to.include.keys(['formPath', 'url', 'id']);
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
      helper.createSiteTest({
        customData: {test: 'test string'},
        psi:        helper.getMockModel('SiteTestPsi'),
        ping:       helper.getMockModel('SiteTestPing'),
        forms:      [
          helper.getMockModel('SiteTestForm'),
          helper.getMockModel('SiteTestForm')
        ]
      })
        .then(function (sitetest) {
          models.SiteTest.findById(sitetest.id, function (err, result) {
            if (err) return done(err);
            self.sitetest = result;
            done();
          });
        }).fail(done).done();
    });

    it('should delete all attached SiteTestForm instances', function (done) {
      var siteFormId = this.sitetest.toObject().forms[0].siteFormId;

      Model.deleteById(siteFormId, function (err) {
        if (err) return done(err);
        models.SiteTestForm.findOne({where: {siteFormId: siteFormId}}, function (err, result) {
          if (err) return done(err);
          expect(result).to.be.a('null');
          done();
        });
      });
    });
  });
});


