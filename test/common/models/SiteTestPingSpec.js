'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/SiteTestPing.js
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
    Model  = models.SiteTestPing;


describe('common.models.SiteTestPing', function () {

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
    it('should give an ValidationError `data` presence when property `data` is not provided', function (done) {
      Model.create({}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.data[0]', 'presence');
        done();
      });
    });

    it('should give an ValidationError `siteTestId presence` when property `siteTestId` is not provided', function (done) {
      Model.create({data: {test: 'test'}}, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.siteTestId[0]', 'presence');
        done();
      });
    });

    it('should give an ValidationError `siteTestId` invalid when property `siteTestId` does not match to any SiteTest instances', function (done) {
      Model.create({
        data:       {test: 'test'},
        siteTestId: 'invalidSiteTestId'
      }, function (err) {
        expect(err).to.be.an.instanceof(loopback.ValidationError);
        expect(err).to.have.deep.property('details.codes.siteTestId[0]', 'invalid');
        done();
      });
    });

    it('should delete existing instances with same siteTestId before saving instance to database', function (done) {
      var mock = helper.getMockModel('SiteTestPing');
      mock.data.message = 'old entry';

      helper.createSiteTest({ping: mock})
        .then(function (sitetest) {
          mock.data.message = 'new entry';

          Model.create({data: mock.data, siteTestId: sitetest.id}, function (err, result) {
            if (err) return done(err);

            Model.find({}, function (err, results) {
              if (err) return done(err);
              expect(results).to.have.length(1);
              expect(results[0]).to.have.deep.property('data.message', 'new entry');
              done();
            });
          });
        }).fail(done).done();
    });
  });

  describe('prevent access remote methods on /api/site-test-pings', function () {
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
          self.sitetest = sitetest;
          Model.findOne({where: {siteTestId: sitetest.id}}, function (err, result) {
            if (err) return done(err);
            self.sitetestping = result;
            done();
          });
        }).fail(done).done();
    });

    it('should not be able to create SiteTestPing instance through POST /api/site-test-pings', function (done) {
      global.request.post('/api/site-test-pings').expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle POST/);
        done();
      });
    });

    it('should not be able to fetch SiteTestPing instances through GET /api/site-test-pings', function (done) {
      global.request.get('/api/site-test-pings').expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle GET/);
        done();
      });
    });

    it('should not be able to fetch SiteTestPing instances through GET /api/site-test-pings/:id', function (done) {
      global.request.get('/api/site-test-pings/' + this.sitetestping.id).expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle GET/);
        done();
      });
    });

    it('should not be able to fetch SiteTestPing instances through GET /api/site-test-pings/findOne', function (done) {
      global.request.get('/api/site-test-pings/findOne').expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle GET/);
        done();
      });
    });

    it('should not be able to check if instance exists through GET /api/site-test-pings/:id/exists', function (done) {
      global.request.get('/api/site-test-pings/' + this.sitetestping.id + '/exists').expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle GET/);
        done();
      });
    });

    it('should not be able to count number of instances through GET /api/site-test-pings/count', function (done) {
      global.request.get('/api/site-test-pings/count').expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle GET/);
        done();
      });
    });

    it('should not be able to update instance through PUT /api/site-test-pings/:id', function (done) {
      global.request.put('/api/site-test-pings/' + this.sitetestping.id).expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle PUT/);
        done();
      });
    });

    it('should not be able to delete instance through DELETE /api/site-test-pings/:id', function (done) {
      global.request.delete('/api/site-test-pings/' + this.sitetestping.id).expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/There is no method to handle DELETE/);
        done();
      });
    });

  });

});
