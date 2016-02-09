'use strict';

/**
 * Mocha Unit Test Script
 * Behaviour Driven Development
 *
 * @class common/models/BaseModel.js
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

describe('common.models.BaseModel', function () {
  var TestAuthor, TestReview, accessToken;

  /**
   * Create models which extends the BaseModel
   * Attach models to dataSource
   * Add disable remote methods
   */
  before(function (done) {
    loopback.createModel({
      name:       'TestReview',
      base:       'BaseModel',
      properties: {
        message: 'string',
        rating:  'object'
      },
      relations:  {
        testAuthor: {
          type:       'belongsTo',
          model:      'TestAuthor',
          foreignKey: 'testAuthorId'
        }
      }
    });

    loopback.createModel({
      name:       'TestAuthor',
      plural:     'test-authors',
      base:       'BaseModel',
      properties: {
        firstName: 'string',
        lastName:  'string'
      },
      relations:  {
        reviews: {
          model: 'TestReview',
          type:  'hasMany'
        }
      }
    });

    TestAuthor = loopback.getModel('TestAuthor');
    TestReview = loopback.getModel('TestReview');
    app.model(TestAuthor, {dataSource: database.datasource.name});
    app.model(TestReview, {dataSource: database.datasource.name});

    TestAuthor.disableRemoteMethods(['create']);
    TestAuthor.disableRelatedRemoteMethods({reviews: ['create']});

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
      global.request.get('/api/test-authors').expect(401).end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.deep.property('error.code', 'AUTHORIZATION_REQUIRED');
        done();
      });
    });
  });

  describe('Extend Class methods', function () {
    it('should contain BaseModel methods', function () {
      expect(_.functions(TestAuthor)).to.include.members([
        'disableRemoteMethods',
        'disableRelatedRemoteMethods',
        'getRelatedModelFromSettingsModelId',
        'getContextObject',
        'getRelationModelIds'
      ]);
    });

    it('should contain PersistedModel methods', function () {
      expect(_.functions(TestAuthor)).to.include.members(_.functions(loopback.getModel('PersistedModel')));
    });
  });

  lt.describe.staticMethod('disableRemoteMethods', function () {
    it('should disable remote method `create`', function (done) {
      var http = global.request.post('/api/test-authors?access_token=' + accessToken);
      http.send({}).expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/has no method handling POST/);
        done();
      });
    });
  });

  lt.describe.staticMethod('disableRelatedRemoteMethods', function () {
    beforeEach(function (done) {
      var self = this;
      TestAuthor.create({
        firstName: 'FirstName',
        lastName:  'LastName'
      }, function (err, result) {
        if (err) return done(err);
        self.author = result;
        done();
      });
    });

    it('should disable remote method `create` for related models', function (done) {
      var http = global.request.post('/api/test-authors/' + this.author.id + '/reviews?access_token=' + accessToken);
      http.send({}).expect(404).end(function (err, res) {
        expect(res.body).to.have.deep.property('error.message').that.match(/has no method handling POST/);
        done();
      });
    });
  });

  lt.describe.staticMethod('getRelatedModelFromSettingsModelId', function () {
    it('should return the Related Model when parsed the related Model ID', function () {
      expect(TestAuthor.getRelatedModelFromSettingsModelId('reviews')).to.have.property('modelName', 'TestReview');
    });
  });

  lt.describe.staticMethod('getModelsBelongsToThisModel', function () {
    it('should return Models belongs to current Model', function () {
      var models = TestAuthor.getModelsBelongsToThisModel();
      expect(models).to.be.an('array').that.have.length(1);
      expect(models[0]).to.have.ownProperty('modelName').that.is.a('function');
      expect(models[0].modelName).to.equal('TestReview');
    });
  });

  lt.describe.staticMethod('getContextObject', function () {
    afterEach(function () {
      TestAuthor._observers['after save'].splice(0, 1);
    });

    it('should return an object with model properties include related model properties', function (done) {
      TestAuthor.observe('after save', function (ctx, next) {
        var obj = TestAuthor.getContextObject(ctx);
        expect(obj).to.be.an('object').and.include.keys(['firstName', 'lastName', 'id', 'reviews']);
        next();
        done();
      });
      TestAuthor.create({reviews: {}}, function (err, result) {
        if (err) return done(err);
      });
    });
  });

  lt.describe.staticMethod('getRelationModelIds', function () {
    it('should return related model ids', function (done) {
      var relatedModelIds = TestAuthor.getRelationModelIds();
      expect(relatedModelIds).to.be.an('array').and.have.members(['reviews']);
      done();
    });
  });

  describe('Remove empty properties from remote methods', function () {
    beforeEach(function (done) {
      var self = this;
      TestAuthor.create({reviews: {}}, function (err, result) {
        if (err) return done(err);
        self.author = result;
        done();
      });
    });

    it('should remove empty properties from remote method `find`', function (done) {
      global.request.get('/api/test-authors?access_token=' + accessToken).end(function (err, res) {
        expect(res.body).to.be.an('array');
        expect(res.body[0]).to.not.include.keys('reviews');
        done();
      });
    });

    it('should remove empty properties from remote method `findById`', function (done) {
      global.request.get('/api/test-authors/' + this.author.id + '?access_token=' + accessToken).end(function (err, res) {
        expect(res.body).to.not.include.keys('reviews');
        done();
      });
    });

    it('should remove empty properties from remote method `findOne`', function (done) {
      global.request.get('/api/test-authors/findOne?access_token=' + accessToken).end(function (err, res) {
        expect(res.body).to.not.include.keys('reviews');
        done();
      });
    });
  });

  describe('beforeRemote::deleteById', function () {
    beforeEach(function (done) {
      var self = this;
      TestAuthor.create({
        firstName: 'FirstName',
        lastName:  'LastName',
      }, function (err, result) {
        if (err) return done(err);
        self.author = result;
        done();
      });
    });

    it('should generate an error when trying to deleteById with an invalid id', function (done) {
      global.request.delete('/api/test-authors/' + this.author.id + 'invalid?access_token=' + accessToken).send().expect(404).end(function (err, res) {
        if (err) return done(err);
        expect(res.body).to.have.deep.property('error.message').that.match(/Unknown "TestAuthor" id/);
        done();
      });
    });
  });

  describe('Model::observe(\'after delete\')', function () {
    beforeEach(function (done) {
      var self = this;
      TestAuthor.create({
        firstName: 'FirstName',
        lastName:  'LastName',
      }, function (err, author) {
        if (err) return done(err);
        self.author = author;

        TestReview.create([
          {
            testAuthorId: author.id,
            message:      'test review',
            rating:       {test: 'rating...'}
          },
          {
            testAuthorId: author.id,
            message:      'test review 2',
            rating:       {test: 'rating...'}
          }
        ], function (err, reviews) {
          if (err) return done(err);
          done();
        });
      });
    });

    it('should remove related models (hasMany and hasOne) when BaseModel instance is being deleted', function (done) {
      var author = this.author;
      TestAuthor.destroyById(author.id, function (err) {
        if (err) return done(err);
        TestReview.findOne({where: {testAuthorId: author.id}}, function (err, result) {
          expect(result).to.be.a('null');
          done();
        });
      });
    });

    it('should remove related models (belongsTo) when BaseModel instance is being deleted and BaseModel has no hasMany relations', function (done) {
      var author = this.author;

      // first create new model, belongsTo TestAuthor (without setting hasMany relation in TestAuthor)
      loopback.createModel({
        name:       'TestOrder',
        base:       'BaseModel',
        properties: {
          orders: ['object']
        },
        relations:  {
          testAuthor: {
            type:       'belongsTo',
            model:      'TestAuthor',
            foreignKey: 'testAuthorId'
          }
        }
      });
      var TestOrder = loopback.getModel('TestOrder');
      app.model(TestOrder, {dataSource: database.datasource.name});

      // create instance
      TestOrder.create({
        testAuthorId: this.author.id,
        orders:       [
          {id: 1, name: 'order 1'},
          {id: 2, name: 'order 2'}
        ]
      }, function (err, result) {

        // destroy test author
        TestAuthor.destroyById(author.id, function (err) {
          if (err) return done(err);

          // testorder should be deleted
          TestOrder.findOne({where: {testAuthorId: author.id}}, function (err, testorder) {
            if (err) return done(err);
            expect(testorder).to.be.a('null');
            done();
          });
        });
      });
    });
  });
});
