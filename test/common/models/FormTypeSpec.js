'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/FormType.js
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
    Model  = models.FormType;


describe('common.models.FormType', function () {

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
    it('should give an ValidationError `casperjs` presence when property `casperjs` is not provided', function (done) {
      Model.create({}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.casperjs[0]', 'presence');
        done();
      });
    });

    it('should give an ValidationError `description` presence when property `description` is not provided', function (done) {
      Model.create({casperjs: '/path/to/casperjs'}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.description[0]', 'presence');
        done();
      });
    });

    it('should create instance when `description` and `capserjs` properties are set', function (done) {
      Model.create({
        casperjs:    '/path/to/casperjs',
        description: 'test script'
      }, function (err, formtype) {
        expect(formtype).to.be.an.instanceof(Model);
        expect(formtype.toObject()).to.include.keys(['casperjs', 'description', 'id']);
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
      helper.createSiteForm()
        .then(function (siteform) {
          self.siteform = siteform;
          done();
        }).fail(done).done();
    });

    it('should delete all attached SiteForm instances', function (done) {
      var formTypeId = this.siteform.formTypeId;
      Model.deleteById(formTypeId, function (err, result) {
        if (err) return done(err);
        loopback.getModel('SiteForm').findOne({where: {formTypeId: formTypeId}}, function (err, result) {
          if (err) return done(err);
          expect(result).to.be.a('null');
          done();
        });
      });
    });
  });

});


