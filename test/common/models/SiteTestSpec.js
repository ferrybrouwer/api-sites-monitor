'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/SiteTest.js
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
    Model  = models.SiteTest;


describe('common.models.SiteTest', function () {
  var accessToken;

  before(function (done) {
    helper.getUserTokenId().then(function (id) {
      accessToken = id;
      done();
    }).fail(done).done();
  });

  /**
   * Clear database before each test
   */
  beforeEach(function (done) {
    app.datasources[database.datasource.name].automigrate(done);
  });

  describe('Authorization', function () {
    it('should generate an ValidationError when user calls a REST endpoint without a valid access token', function (done) {
      global.request.get('/api/site-tests').expect(401).end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.deep.property('error.code', 'AUTHORIZATION_REQUIRED');
        done();
      });
    });
  });

  /**
   * Static method `getRelationModelIds`
   * Check if it returns the related model properties
   */
  lt.describe.staticMethod('getRelationModelIds', function () {
    it('should get only the ids of related models', function () {
      expect(Model.getRelationModelIds()).to.be.an('array').and.have.members(['forms', 'ping', 'psi']).and.to.have.length(3);
    });
  });

  /**
   * Method `hasValidTestProperties`
   * Check if `hasValidTestProperties` returns the correct boolean value
   */
  describe('SiteTest.prototype.hasValidTestProperties', function () {
    afterEach(function () {
      Model._observers['before save'].splice(1, 1);
    });

    it('should return false if instance does not contains any test property', function (done) {
      Model.observe('before save', function (ctx, next) {
        expect(ctx.instance.hasValidTestProperties()).to.equal(false);
        done();
      });
      helper.createSiteTest({}).done();
    });

    it('should return true if instance does contain a test property `customData`', function (done) {
      Model.observe('before save', function (ctx, next) {
        expect(ctx.instance.hasValidTestProperties()).to.equal(true);
        done();
      });
      helper.createSiteTest({customData: {test: 'sdfsdf'}}).done();
    });

    it('should return true if instance does contain a test property `forms`', function (done) {
      Model.observe('before save', function (ctx, next) {
        expect(ctx.instance.hasValidTestProperties()).to.equal(true);
        done();
      });
      helper.createSiteTest({forms: [helper.getMockModel('SiteTestForm')]}).done();
    });

    it('should return true if instance does contain a test property `psi`', function (done) {
      Model.observe('before save', function (ctx, next) {
        expect(ctx.instance.hasValidTestProperties()).to.equal(true);
        done();
      });
      helper.createSiteTest({psi: helper.getMockModel('SiteTestPsi')}).done();
    });

    it('should return true if instance does contain a test property `ping`', function (done) {
      Model.observe('before save', function (ctx, next) {
        expect(ctx.instance.hasValidTestProperties()).to.equal(true);
        done();
      });
      helper.createSiteTest({ping: helper.getMockModel('SiteTestPing')}).done();
    });
  });

  /**
   * Static method `create`
   * Tests for check if instance is created successfully
   */
  lt.describe.staticMethod('create', function () {
    describe('no siteId property', function () {
      it('should generate ValidationError: with code siteId:presence', function (done) {
        Model.create(helper.getMockModel('SiteTest'), function (err, sitetest) {
          if (err) {
            expect(err).to.be.an.instanceof(loopback.ValidationError);
            expect(err).to.have.deep.property('details.codes.siteId[0]', 'presence');
            done();
          } else {
            done(new Error('should not create SiteTest instance when siteId is not provided.'));
          }
        });
      });
    });

    describe('no test properties', function () {
      it('should generate ValidationError: with code testPropeties:invalid_test_properties', function (done) {
        helper.createSiteTest()
          .then(function (sitetest) {
            done(new Error('should not create SiteTest instance when test properties are not provided.'));
          })
          .fail(function (err) {
            expect(err).to.be.an.instanceof(loopback.ValidationError);
            expect(err).to.have.deep.property('details.codes.testProperties[0]', 'invalid_test_properties');
            done();
          })
          .done();
      });
    });

    describe('with `customData` property', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSiteTest({customData: {test: 'sdfxhans'}})
          .then(function (sitetest) {
            self.sitetest = sitetest;
            done();
          }).fail(done).done();
      });

      it('should create instance', function () {
        expect(this.sitetest).to.be.an('object');
        expect(this.sitetest).to.be.an.instanceof(Model);
      });

      it('should have valid properties', function (done) {
        var obj = this.sitetest.toObject();
        expect(obj).to.include.keys(['siteId', 'createdAt', 'id']);
        expect(new Date(obj.createdAt).toString()).to.not.equal('Invalid Date');

        models.Site.findOne({where: {id: obj.siteId}}, function (err, site) {
          expect(site).to.be.an('object').and.to.be.an.instanceof(models.Site);
          done();
        });
      });
    });

    describe('with `forms` property', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSiteTest({
          forms: [
            helper.getMockModel('SiteTestForm'),
            helper.getMockModel('SiteTestForm')
          ]
        })
          .then(function (sitetest) {
            self.sitetest = sitetest;
            done();
          }).fail(done).done();
      });

      it('should create instance', function () {
        expect(this.sitetest).to.be.an('object');
        expect(this.sitetest).to.be.an.instanceof(Model);
      });

      it('should have valid properties', function (done) {
        var obj = this.sitetest.toObject();
        expect(obj).to.include.keys(['siteId', 'createdAt', 'id']);
        expect(new Date(obj.createdAt).toString()).to.not.equal('Invalid Date');
        models.Site.findOne({where: {id: obj.siteId}}, function (err, site) {
          expect(site).to.be.an('object').and.to.be.an.instanceof(models.Site);
          done();
        });
      });

      it('should create SiteTestForm instance(s)', function (done) {
        models.SiteTestForm.find({where: {siteTestId: this.sitetest.id}}, function (err, siteTestForms) {
          if (err) return done(err);
          expect(siteTestForms).to.be.an('array').and.have.length(2);
          siteTestForms.forEach(function (siteTestForm) {
            expect(siteTestForm).to.be.an.instanceof(models.SiteTestForm);
          });
          done();
        });
      });
    });

    describe('with `psi` property', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSiteTest({psi: helper.getMockModel('SiteTestPsi')})
          .then(function (sitetest) {
            self.sitetest = sitetest;
            done();
          }).fail(done).done();
      });

      it('should create instance', function () {
        expect(this.sitetest).to.be.an('object');
        expect(this.sitetest).to.be.an.instanceof(Model);
      });

      it('should have valid properties', function (done) {
        var obj = this.sitetest.toObject();
        expect(obj).to.include.keys(['siteId', 'createdAt', 'id']);
        expect(new Date(obj.createdAt).toString()).to.not.equal('Invalid Date');
        models.Site.findOne({where: {id: obj.siteId}}, function (err, site) {
          expect(site).to.be.an('object').and.to.be.an.instanceof(models.Site);
          done();
        });
      });

      it('should create SiteTestPsi instance', function (done) {
        models.SiteTestPsi.find({where: {siteTestId: this.sitetest.id}}, function (err, siteTestPsis) {
          if (err) return done(err);
          expect(siteTestPsis).to.be.an('array').and.have.length(1);
          siteTestPsis.forEach(function (siteTestPsi) {
            expect(siteTestPsi).to.be.an.instanceof(models.SiteTestPsi);
          });
          done();
        });
      });
    });

    describe('with `ping` property', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSiteTest({ping: helper.getMockModel('SiteTestPing')})
          .then(function (sitetest) {
            self.sitetest = sitetest;
            done();
          }).fail(done).done();
      });

      it('should create instance', function () {
        expect(this.sitetest).to.be.an('object');
        expect(this.sitetest).to.be.an.instanceof(Model);
      });

      it('should have valid properties', function (done) {
        var obj = this.sitetest.toObject();
        expect(obj).to.include.keys(['siteId', 'createdAt', 'id']);
        expect(new Date(obj.createdAt).toString()).to.not.equal('Invalid Date');
        models.Site.findOne({where: {id: obj.siteId}}, function (err, site) {
          expect(site).to.be.an('object').and.to.be.an.instanceof(models.Site);
          done();
        });
      });

      it('should create SiteTestPing instance', function (done) {
        models.SiteTestPing.find({where: {siteTestId: this.sitetest.id}}, function (err, siteTestPings) {
          if (err) return done(err);
          expect(siteTestPings).to.be.an('array').and.have.length(1);
          siteTestPings.forEach(function (siteTestPing) {
            expect(siteTestPing).to.be.an.instanceof(models.SiteTestPing);
          });
          done();
        });
      });
    });
  });

  /**
   * REST endpoint /api/site-tests with verb `POST`
   * Check if instances are created successfully and response are passed correctly
   */
  describe('POST /api/site-tests', function () {
    describe('no post data', function () {
      beforeEach(function (done) {
        var http = global.request.post('/api/site-tests?access_token=' + accessToken);
        http.expect(422).end((function (err, res) {
          if (err) return done(err);
          this.req = http.req;
          this.res = http.res;
          done();
        }).bind(this));
      });

      it('should generate ValidationError: with code siteId:presence', function () {
        expect(this.res.body).to.have.deep.property('error.details.codes.siteId[0]', 'presence');
      });

      it('should not create any model instances', function (done) {
        Model.count(function (err, result) {
          if (err) return done(err);
          expect(result).to.be.equal(0);
          done();
        });
      });
    });

    describe('with an invalid siteId', function () {
      beforeEach(function (done) {
        var http = global.request.post('/api/site-tests?access_token=' + accessToken);
        http.send({siteId: 'invalidId'}).expect(422).end((function (err, result) {
          if (err) return done(err);
          this.req = http.req;
          this.res = http.res;
          done();
        }).bind(this));
      });

      it('should generate ValidationError: with code siteId:invalid', function () {
        expect(this.res.body).to.have.deep.property('error.details.codes.siteId[0]', 'invalid');
      });

      it('should not create any model instances', function (done) {
        Model.count(function (err, result) {
          if (err) return done(err);
          expect(result).to.be.equal(0);
          done();
        });
      });
    });

    describe('with a valid siteId', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSite()
          .then(function (site) {
            var http = global.request.post('/api/site-tests?access_token=' + accessToken);
            http.send({siteId: site.id}).expect(422).end(function (err, result) {
              if (err) return done(err);
              self.req = http.req;
              self.res = http.res;
              done();
            });
          }).fail(done).done();
      });

      it('should generate ValidationError: with code testPropeties:invalid_test_properties', function () {
        expect(this.res.body).to.have.deep.property('error.details.codes.testProperties[0]', 'invalid_test_properties');
      });

      it('should not create any model instances', function (done) {
        Model.count(function (err, result) {
          if (err) return done(err);
          expect(result).to.be.equal(0);
          done();
        });
      });
    });

    describe('with valid siteId and customData', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSite()
          .then(function (site) {
            var http = global.request.post('/api/site-tests?access_token=' + accessToken);
            http.send({
              siteId:     site.id,
              customData: {test: 'test string'}
            }).expect(200).end(function (err, result) {
              if (err) return done(err);
              self.req = http.req;
              self.res = http.res;
              done();
            });
          }).fail(done).done();
      });

      it('should create a new model instance', function (done) {
        Model.count({}, function (err, result) {
          if (err) return done(err);
          expect(result).to.equal(1);
          done();
        });
      });

      it('should store customData in site-test model instance', function (done) {
        Model.findOne({}, function (err, result) {
          if (err) return done(err);
          expect(result.toObject()).to.include.keys('customData');
          done();
        });
      });
    });

    describe('with valid siteId and -ping object', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSite()
          .then(function (site) {
            var http = global.request.post('/api/site-tests?access_token=' + accessToken);
            http.send({
              siteId: site.id,
              ping:   helper.getMockModel('SiteTestPing')
            }).expect(200).end(function (err, result) {
              if (err) return done(err);
              self.req = http.req;
              self.res = http.res;
              done();
            });
          }).fail(done).done();
      });

      it('should create a new model instance', function (done) {
        Model.count({}, function (err, result) {
          if (err) return done(err);
          expect(result).to.equal(1);
          done();
        });
      });

      it('should create a valid SiteTestPing instance with valid siteTestId', function (done) {
        var siteTestId = this.res.body.id;
        models.SiteTestPing.findOne({}, function (err, result) {
          if (err) return done(err);
          expect(result).is.an.instanceof(models.SiteTestPing);
          expect(result.toObject()).to.include.keys('siteTestId');
          expect(result.toObject().siteTestId.toString()).to.equal(siteTestId.toString());
          done();
        });
      });
    });

    describe('with valid siteId and -psi object', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSite()
          .then(function (site) {
            var http = global.request.post('/api/site-tests?access_token=' + accessToken);
            http.send({
              siteId: site.id,
              psi:    helper.getMockModel('SiteTestPsi')
            }).expect(200).end(function (err, result) {
              if (err) return done(err);
              self.req = http.req;
              self.res = http.res;
              done();
            });
          }).fail(done).done();
      });

      it('should create a new model instance', function (done) {
        Model.count({}, function (err, result) {
          if (err) return done(err);
          expect(result).to.equal(1);
          done();
        });
      });

      it('should create a valid SiteTestPsi instance with valid siteTestId', function (done) {
        var siteTestId = this.res.body.id;
        models.SiteTestPsi.findOne({}, function (err, result) {
          if (err) return done(err);
          expect(result).is.an.instanceof(models.SiteTestPsi);
          expect(result.toObject()).to.include.keys('siteTestId');
          expect(result.toObject().siteTestId.toString()).to.equal(siteTestId.toString());
          done();
        });
      });
    });

    describe('with valid siteId and -forms array', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSite()
          .then(function (site) {
            self.site = site;
            return helper.createSiteForm();
          })
          .then(function (siteform) {
            self.siteform = siteform;
            var formdata = _.extend(helper.getMockModel('SiteTestForm'), {siteFormId: siteform.id});
            var http = global.request.post('/api/site-tests?access_token=' + accessToken);
            http.send({
              siteId: self.site.id,
              forms:  [formdata, formdata]
            }).expect(200).end(function (err) {
              if (err) return done(err);
              self.req = http.req;
              self.res = http.res;
              done();
            });
          }).fail(done).done();
      });

      it('should create a new model instance', function (done) {
        Model.count({}, function (err, result) {
          if (err) return done(err);
          expect(result).to.equal(1);
          done();
        });
      });

      it('should create a valid SiteTestForm instance(s) with valid siteTestId', function (done) {
        var siteTestId = this.res.body.id;
        var siteform = this.siteform;

        models.SiteTestForm.find({}, function (err, results) {
          if (err) return done(err);
          expect(results).to.be.an('array').and.to.have.length(2);
          results.forEach(function (result) {
            expect(result).is.an.instanceof(models.SiteTestForm);
            expect(result.toObject()).to.contain.all.keys(['siteTestId', 'siteFormId']);
            expect(result.toObject().siteTestId.toString()).to.equal(siteTestId.toString());
            expect(result.toObject().siteFormId.toString()).to.equal(siteform.id.toString());
          });
          done();
        });
      });
    });

    describe('related model properties on POST /api/site-tests/:id/[psi,forms,ping]', function () {
      beforeEach(function (done) {
        var self = this;
        helper.createSiteTest({customData: {test: 'hallo'}})
          .then(function (sitetest) {
            self.siteTestId = sitetest.id;
            done();
          }).fail(done).done();
      });

      it('should not create related property `psi` instance and return an error', function (done) {
        var http = global.request.post('/api/site-test/' + this.siteTestId + '/psi?access_token=' + accessToken);
        http.send(helper.getMockModel('SiteTestPsi')).expect(404);
        http.end(function (err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.equal(404);
          models.SiteTestPsi.count({}, function (err, count) {
            if (err) return done(err);
            expect(count).to.equal(0);
            done();
          });
        });
      });

      it('should not create related property `ping` instance and return an error', function (done) {
        var http = global.request.post('/api/site-test/' + this.siteTestId + '/ping?access_token=' + accessToken);
        http.send(helper.getMockModel('SiteTestPing')).expect(404);
        http.end(function (err, res) {
          if (err) return done(err);
          expect(res.statusCode).to.equal(404);
          models.SiteTestPing.count({}, function (err, count) {
            if (err) return done(err);
            expect(count).to.equal(0);
            done();
          });
        });
      });

      it('should not create related property `forms` instances and return an error', function (done) {
        var siteTestId = this.siteTestId;
        models.SiteForm.findOne({}, function (err, siteform) {
          if (err) return done(err);
          var http = global.request.post('/api/site-test/' + siteTestId + '/forms?access_token=' + accessToken);
          var formdata = _.extend(helper.getMockModel('SiteTestForm'), {siteFormId: siteform.id});
          http.send([formdata, formdata]).expect(404);
          http.end(function (err, res) {
            if (err) return done(err);
            expect(res.statusCode).to.equal(404);
            models.SiteTestForm.count({}, function (err, count) {
              if (err) return done(err);
              expect(count).to.equal(0);
              done();
            });
          });
        });
      });
    });
  });// POST /api/site-tests

  /**
   * Static method `update`
   * Tests for check if instance can be updated successfully
   */
  lt.describe.staticMethod('update', function () {
    beforeEach(function (done) {
      var self = this;
      helper.createSiteTest({
        customData: {test: 'test string'},
        forms:      [helper.getMockModel('SiteTestForm'), helper.getMockModel('SiteTestForm')],
        psi:        helper.getMockModel('SiteTestPsi'),
        ping:       helper.getMockModel('SiteTestPing')
      })
        .then(function (sitetest) {
          Model.findOne({where: {id: sitetest.toObject().id}}, function (err, result) {
            if (err) return done(err);
            self.sitetest = result;
            done();
          });
        }).fail(done).done();
    });

    it('should be able to update attribute `customData` of an existing SiteTest instance', function (done) {
      var _test = this.sitetest;
      _test.updateAttribute('customData', {test: 'hallo'}, function (err, result) {
        if (err) return done(err);
        var compareObject = _.extend(_.clone(_test.toObject()), {customData: {test: 'hallo'}});
        expect(result.toObject()).to.deep.equal(compareObject);
        done();
      });
    });
  });

  /**
   * REST endpoint /api/site-tests with verb `PUT`
   * Check if instances can be updated successfully and response are passed correctly
   */
  describe('PUT /api/site-tests/:id', function () {
    beforeEach(function (done) {
      var self = this;
      helper.createSiteTest({
        customData: {test: 'hallo'}
      })
        .then(function (sitetest) {
          self.siteTestId = sitetest.id;
          done();
        }).fail(done).done();
    });

    it('should return an Error `property (id) cannot be updated` when id is invalid', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      http.send({id: '-1'}).expect(400).expect('Content-Type', /json/).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.deep.property('error.name', 'Error');
        expect(http.res.body).to.have.deep.property('error.message').that.match(/property \(id\) cannot be updated/);
        done();
      });
    });

    it('should return an ValidationError if no test properties are passed', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      http.send({}).expect(422).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.deep.property('error.name', 'ValidationError');
        expect(http.res.body).to.have.deep.property('error.details.messages.testProperties').that.is.an('array').that.match(/Cannot update attribute/);
        done();
      });
    });

    it('should return an Error if invalid (test) properties are passed', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      http.send({invalidProp: new Date()}).expect(422).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.deep.property('error.details.codes.validProperties[0]', 'invalid_instance_properties');
        done();
      });
    });

    it('should be able to update `customData` property', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      http.send({customData: {test: 'update custom data'}}).expect(200).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.deep.property('customData.test', 'update custom data');
        Model.count({}, function (err, count) {
          expect(count).to.equal(1);
          done();
        });
      });
    });

    it('should be able to update `ping` property', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      var pingdata = helper.getMockModel('SiteTestPing');
      pingdata.data.message = 'updated entry';
      http.send({ping: pingdata}).expect(200).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.deep.property('ping.data.message', 'updated entry');
        done();
      });
    });

    it('should be able to update `psi` property', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      var psidata = helper.getMockModel('SiteTestPsi');
      psidata.data.overview.message = 'updated entry';
      http.send({psi: psidata}).expect(200).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.deep.property('psi.data.overview.message', 'updated entry');
        done();
      });
    });

    it('should be able to update `forms` property', function (done) {
      var http = global.request.put('/api/site-tests/' + this.siteTestId + '?access_token=' + accessToken);
      var formdata = helper.getMockModel('SiteTestForm');
      formdata.stdout.push('updated entry');
      http.send({forms: [formdata, formdata]}).expect(200).end(function (err) {
        if (err) return done(err);
        expect(http.res.body).to.have.property('forms').that.is.an('array').that.have.length(2);
        http.res.body.forms.forEach(function (form) {
          expect(form).to.have.property('stdout').that.is.an('array').to.contain('updated entry');
        });
        done();
      });
    });
  });

  /**
   * REST endpoint /api/site-tests with verb `DELETE`
   * Check if instances can be deleted successfully and response are passed correctly
   */
  describe('DELETE /api/site-tests/:id', function () {
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
          Model.findById(sitetest.id, function (err, result) {
            if (err) return done(err);
            self.sitetest = result;
            done();
          });
        }).fail(done).done();
    });

    it('should delete sitetest instance', function (done) {
      var siteTestId = this.sitetest.id;
      global.request.delete('/api/site-tests/' + siteTestId + '?access_token=' + accessToken).expect(200).end(function (err, res) {
        Model.findById(siteTestId, function (err, result) {
          expect(result).to.be.a('null');
          done();
        });
      });
    });

    it('should delete related models with attached siteTestId', function (done) {
      var siteTestId = this.sitetest.id;
      global.request.delete('/api/site-tests/' + siteTestId + '?access_token=' + accessToken).expect(200).end(function (err, res) {
        var relatedModelCount = 0;
        Model.getRelationModelIds().forEach(function (modelId) {
          var relatedModel = Model.getRelatedModelFromSettingsModelId(modelId);
          relatedModel.findOne({where: {siteTestId: siteTestId}}, function (err, result) {
            expect(result).to.be.a('null');
            relatedModelCount++;
            if (Model.getRelationModelIds().length === relatedModelCount) {
              done();
            }
          });
        });
      });
    });
  });

  /**
   * REST endpoints /api/site-tests with verb `GET`
   * Check if can fetch SiteTest instances successfully
   */
  describe('GET /api/site-tests', function () {
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
          done();
        }).fail(done).done();
    });

    describe('/', function () {
      it('should fetch SiteTest instances with valid SiteTest properties', function (done) {
        global.request.get('/api/site-tests?access_token=' + accessToken).expect(200).end(function (err, res) {
          expect(res.body).to.be.an('array');
          res.body.forEach(function (sitetest) {
            expect(sitetest).to.be.an('object').and.include.keys([
              'createdAt',
              'customData',
              'id',
              'siteId',
              'forms',
              'ping',
              'psi'
            ]);
            expect(sitetest.createdAt).to.be.an('string');
            expect(sitetest.customData).to.be.an('object');
            expect(sitetest.id).to.be.an('string');
            expect(sitetest.siteId).to.be.an('string');
            expect(sitetest.forms).to.be.an('array');
            expect(sitetest.ping).to.be.an('object');
            expect(sitetest.psi).to.be.an('object');
          });
          done();
        });
      });

      it('should fetch SiteTest instances with a valid Date string for property `createdAt`', function (done) {
        global.request.get('/api/site-tests?access_token=' + accessToken).expect(200).end(function (err, res) {
          res.body.forEach(function (sitetest) {
            expect(new Date(sitetest.createdAt).toString()).to.not.equal('Invalid Date');
          });
          done();
        });
      });
    });

    describe('/findOne', function () {
      it('should fetch a SiteTest instance with valid SiteTest properties', function (done) {
        global.request.get('/api/site-tests/findOne?access_token=' + accessToken).expect(200).end(function (err, res) {
          expect(res.body).to.be.an('object').and.include.keys([
            'createdAt',
            'customData',
            'id',
            'siteId',
            'forms',
            'ping',
            'psi'
          ]);
          expect(res.body.createdAt).to.be.an('string');
          expect(res.body.customData).to.be.an('object');
          expect(res.body.id).to.be.an('string');
          expect(res.body.siteId).to.be.an('string');
          expect(res.body.forms).to.be.an('array');
          expect(res.body.ping).to.be.an('object');
          expect(res.body.psi).to.be.an('object');
          done();
        });
      });

      it('should fetch SiteTest instance with a valid Date string for property `createdAt`', function (done) {
        global.request.get('/api/site-tests/findOne?access_token=' + accessToken).expect(200).end(function (err, res) {
          expect(new Date(res.body.createdAt).toString()).to.not.equal('Invalid Date');
          done();
        });
      });
    });

    describe('/:id', function () {
      it('should give an error when try to fetch a SiteTest instance with an invalid id', function (done) {
        global.request.get('/api/site-tests/' + this.sitetest.id + 'invalid?access_token=' + accessToken).expect(404).end(function (err, res) {
          expect(res.body).to.have.deep.property('error.message').that.match(/Unknown "SiteTest" id/);
          done();
        });
      });

      it('should respond with one SiteTest instance if a valid SiteTest instance id is provided', function (done) {
        global.request.get('/api/site-tests/' + this.sitetest.id + '?access_token=' + accessToken).expect(200).end(function (err, res) {
          expect(res.body).to.be.an('object').and.include.keys([
            'createdAt',
            'customData',
            'id',
            'siteId',
            'forms',
            'ping',
            'psi'
          ]);
          expect(res.body.createdAt).to.be.an('string');
          expect(res.body.customData).to.be.an('object');
          expect(res.body.id).to.be.an('string');
          expect(res.body.siteId).to.be.an('string');
          expect(res.body.forms).to.be.an('array');
          expect(res.body.ping).to.be.an('object');
          expect(res.body.psi).to.be.an('object');
          done();
        });
      });
    });
  });

});// common.models.SiteTest


