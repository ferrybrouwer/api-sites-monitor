var _        = require('lodash'),
    Q        = require('q'),
    loopback = require('loopback');

module.exports = function (SiteTest) {

  // disable remote methods
  SiteTest.disableRemoteMethods([
    'update', 'updateById',
    'upsert', 'upsertById'
  ]);

  // disable related remote methods
  SiteTest.disableRelatedRemoteMethods({
    forms: [
      'update', 'updateById',
      'delete', 'deleteById',
      'destroy', 'destroyById'
    ],
    psi:   [
      'update', 'updateById',
      'delete', 'deleteById',
      'destroy', 'destroyById',
    ],
    ping:  [
      'update', 'updateById',
      'delete', 'deleteById',
      'destroy', 'destroyById',
    ]
  });

  /**
   * Check if instance has valid test properties
   * Test properties are: customData, forms, ping or psi
   *
   * @returns {boolean}
   */
  SiteTest.prototype.hasValidTestProperties = function () {
    var self = this;
    var testPropertiesFound = false;
    if (_.isObject(self.customData)) {
      testPropertiesFound = true;
    } else {
      SiteTest.getRelationModelIds().forEach(function (modelId) {
        var data = self[modelId]();
        if (_.isObject(data)) {
          testPropertiesFound = true;
        }
      });
    }
    return testPropertiesFound;
  };

  /**
   * Create or update related model of SiteTest instance
   *
   * @param     {BaseSiteTestModel}   relatedModel
   * @param     {object}                  data
   * @returns   {Promise}
   */
  SiteTest.prototype.createOrUpdateRelatedModel = function (relatedModel, data) {
    var deferred = Q.defer();

    if (!(relatedModel instanceof loopback.getModel('BaseSiteTestModel').constructor)) {
      deferred.reject('relatedModel should be an instanceof BaseSiteTestModel');
    }
    if (!data) {
      deferred.reject('Cannot set empty data of ' + relatedModel.modelName);
    }

    if (relatedModel && data) {
      var siteTestId = this.id;
      if (_.isArray(data)) {
        data.forEach(function (obj) {
          obj.siteTestId = siteTestId;
        });
      } else {
        data.siteTestId = siteTestId;
      }

      relatedModel.create(data, function (err, result) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(result);
        }
      });
    }
    return deferred.promise;
  };

  /**
   * Validate instance
   * Should contain a `siteId` property
   * @static
   */
  SiteTest.validatesPresenceOf('siteId', {
    message: 'Should contains a siteId'
  });

  /**
   * Validate instance
   * Should contain a valid `siteId` property
   *
   * @param {function} _err
   * @param {function} done
   * @static
   */
  SiteTest.validateAsync('siteId', function (_err, done) {
    loopback.getModel('Site').findById(this.siteId, function (err, result) {
      if (_.isNull(result)) {
        _err();
      }
      done();
    });
  }, {
    message: 'Invalid siteId',
    code:    'invalid'
  });

  /**
   * Validate instance
   * Should not contain invalid properties
   *
   * @param {function} _err
   * @param {function} done
   * @static
   */
  SiteTest.validateAsync('validProperties', function (_err, done) {
    var allowedProperties = ['id', 'siteId', 'createdAt', 'forms', 'ping', 'psi', 'customData'];
    for (var prop in this.toJSON()) {
      if (allowedProperties.indexOf(prop) === -1) {
        _err();
        break;
      }
    }
    done();
  }, {
    message: 'Invalid SiteTest instance properties',
    code:    'invalid_instance_properties'
  });

  /**
   * Validate instance
   * Should contain at least one valid test property
   *
   * @param {function} err
   * @static
   *
   */
  SiteTest.validate('testProperties', function (err) {
    if (this.hasValidTestProperties() === false) {
      err();
    }
  }, {
    message: 'Invalid test properties, should contain `customData`, `forms`, `psi` or/and `ping`',
    code:    'invalid_test_properties'
  });

  /**
   * Before save model instance
   * Add `createdAt` date
   *
   * @param {object}    ctx
   * @param {function}  next
   */
  SiteTest.observe('before save', function (ctx, next) {
    if (ctx.isNewInstance === true) {
      ctx[ctx.instance ? 'instance' : 'data'].createdAt = Date.now();
    }
    next();
  });

  /**
   * After save model instance
   * Update related model properties
   *
   * @param {object}    ctx
   * @param {function}  next
   */
  SiteTest.observe('after save', function (ctx, next) {
    var modelsUpdated = 0;
    var contextObject = SiteTest.getContextObject(ctx);
    var relatedModelIds = _.filter(_.keys(contextObject), function (contextProperty) {
      return SiteTest.getRelationModelIds().indexOf(contextProperty) !== -1;
    });

    relatedModelIds.forEach(function (modelId) {
      var model = SiteTest.getRelatedModelFromSettingsModelId(modelId);
      var data = contextObject[modelId];
      ctx.instance.createOrUpdateRelatedModel(model, data)
        .then(function () {
          modelsUpdated++;
          if (modelsUpdated === relatedModelIds.length) {
            next();
          }
        }).fail(next).done();
    });

    if (relatedModelIds.length === 0) {
      next();
    }
  });

  /**
   * BeforeRemote method on instance updateAttributes
   * Validate if there are valid properties to update
   *
   * @param {object} ctx
   * @param {SiteTest} sitetest
   * @param {function} next
   */
  SiteTest.beforeRemote('prototype.updateAttributes', function (ctx, sitetest, next) {
    var data = ctx.args.data;
    var siteTestId = ctx.instance.id;

    // When data is empty, we have nothing update. Generate a ValidationError
    if (_.isEmpty(data)) {
      var err = new loopback.ValidationError(
        _.extend(ctx.instance, {
          errors: {
            testProperties: ['Cannot update attribute(s). Should provide valid test properties.']
          }
        })
      );
      next(err);
      return false;
    }

    // When data only contains related model properties, it would normally generate an error, because there
    // are no properties for SiteTest instance to store. Here we want to remove and (update or insert)
    // the related model property and break the request chain
    var withoutRelatedModelProps = _.without.apply(_, [_.keys(data)].concat(SiteTest.getRelationModelIds()));
    var modelsUpdated = 0;
    if (!_.isEmpty(data) && _.isEmpty(withoutRelatedModelProps)) {
      var modelIdsToUpdate = _.filter(SiteTest.getRelationModelIds(), function (_a) {
        return _.keys(data).indexOf(_a) !== -1;
      });
      modelIdsToUpdate.forEach(function (modelId) {
        var _model = SiteTest.getRelatedModelFromSettingsModelId(modelId);
        var _data = data[modelId];
        ctx.instance.createOrUpdateRelatedModel(_model, _data)
          .then(function () {
            modelsUpdated++;
            if (modelsUpdated === modelIdsToUpdate.length) {

              // return SiteTest instance with related model properties
              SiteTest.findById(siteTestId, function (err, result) {
                if (err) {
                  next(err);
                } else {
                  ctx.res.json(result.toJSON());
                }
              });
            }
          }).fail(next).done();
      });
      return false;
    }

    // default call the next middleware in the stack
    next();
  });
};
