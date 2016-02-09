'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/BaseSiteTestModel.js
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

describe('common.models.BaseSiteTestModel', function () {
  var SiteSpeedTestModel;

  /**
   * Create models which extends the BaseSiteTestModel
   * Attach models to dataSource
   */
  before(function (done) {
    loopback.createModel({
      name:       'SiteSpeedTestModel',
      base:       'BaseSiteTestModel',
      properties: {
        data: 'object'
      }
    });

    SiteSpeedTestModel = loopback.getModel('SiteSpeedTestModel');
    app.model(SiteSpeedTestModel, {dataSource: database.datasource.name});

    done();
  });

  /**
   * Clear database before each test
   */
  beforeEach(function (done) {
    app.datasources[database.datasource.name].automigrate(done);
  });

  describe('Relation to SiteTest', function () {
    it('should have relation property belongsTo SiteTest with foreignKey `siteTestId`', function () {
      expect(SiteSpeedTestModel.relations).to.have.deep.property('siteTest.type', 'belongsTo');
      expect(SiteSpeedTestModel.relations).to.have.deep.property('siteTest.keyFrom', 'siteTestId');
    });
  });

  describe('BaseModel methods', function () {
    it('should contain BaseModel methods', function () {
      expect(_.functions(SiteSpeedTestModel)).to.include.members([
        'disableRemoteMethods',
        'disableRelatedRemoteMethods',
        'getRelatedModelFromSettingsModelId',
        'getContextObject',
        'getRelationModelIds'
      ]);
    });
  });

  describe('Validation methods', function (done) {
    it('should give an ValidationError when `siteTestId` is not provided', function (done) {
      SiteSpeedTestModel.create({}, function (err, result) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.siteTestId[0]', 'presence');
        done();
      });
    });

    it('should give an ValidationError when an invalid `siteTestId` is provided', function (done) {
      SiteSpeedTestModel.create({siteTestId: 'invalidSiteTestId'}, function (err, result) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.siteTestId[0]', 'invalid');
        done();
      });
    });
  });

  describe('Before save', function () {
    beforeEach(function (done) {
      var self = this;
      helper.createSiteTest({customData: {test: ''}})
        .then(function (sitetest) {
          self.sitetest = sitetest;

          SiteSpeedTestModel.create({siteTestId: sitetest.id, data: {message: 'old entry'}}, function (err, result) {
            if (err) return done(err);
            done();
          });
        })
        .fail(done).done();
    });

    it('should destroy all model instances with same siteTestId before new instance is being saved', function (done) {
      var siteTestId = this.sitetest.id;
      SiteSpeedTestModel.create({siteTestId: siteTestId, data: {message: 'new entry'}}, function (err) {
        if (err) return done(err);
        SiteSpeedTestModel.find({where: {siteTestId: siteTestId}}, function (err, results) {
          if (err) return done(err);
          expect(results).to.be.an('array').and.have.length(1);
          expect(results[0]).to.have.deep.property('data.message', 'new entry');
          done();
        });
      });
    });
  });

});
