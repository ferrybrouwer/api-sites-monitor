var _        = require('lodash'),
    loopback = require('loopback'),
    util     = require('util'),
    Q        = require('q'),
    app      = require('../../server/server');

/**
 * BaseModel
 * Base model contains some additional helper methods
 *
 * @param {PersistedModel} BaseModel
 */
module.exports = function (BaseModel) {

  /**
   * Setup Base Model
   * The setup method is used for Classes extending this Model
   *
   * @this {BaseModel}
   * @constructor
   */
  BaseModel.setup = function () {
    var Model = this;
    loopback.getModel('PersistedModel').setup.call(this);

    /**
     * Remove empty result properties from middleware stack
     *
     * @param {object}          context
     * @param {PersistedModel}  instance
     * @param {function}        next
     */
    function removeEmptyResultProperties(context, instance, next) {
      if (context.result) {
        var r = [];
        var isSingle = !_.isArray(context.result);
        _.each(isSingle ? [context.result] : context.result, function (obj) {
          obj = obj.toObject();
          _.each(Model.getRelationModelIds(), function (modelId) {
            if (obj.hasOwnProperty(modelId) && _.isEmpty(obj[modelId])) {
              delete obj[modelId];
            }
          });
          r.push(obj);
        });
        context.result = isSingle ? r[0] : r;
      }
      next();
    }

    /**
     * Disable remote methods
     *
     * @param {array} methods
     */
    Model.disableRemoteMethods = function (methods) {
      methods = methods || [];
      var self = this;
      methods.forEach(function (methodType) {
        self.disableRemoteMethod(methodType, true);
      });
    };

    /**
     * Disable remote methods for related models
     *
     * @param {object} methods
     */
    Model.disableRelatedRemoteMethods = function (methods) {
      methods = methods || {};
      var self = this;
      _.each(methods, function (remoteMethods, modelId) {
        remoteMethods.forEach(function (methodType) {
          self.disableRemoteMethod('__' + methodType + '__' + modelId, false);
        });
      });
    };

    /**
     * Get related model by model id
     *
     * @param     {string}                modelId
     * @returns   {BaseSiteTestModel}
     */
    Model.getRelatedModelFromSettingsModelId = function (modelId) {
      return loopback.getModel(this.settings.relations[modelId].model);
    };

    /**
     * Get context object with attached related models
     *
     * @param {object}
     */
    Model.getContextObject = function (ctx) {
      var obj = ctx.instance ? ctx.instance.toObject() : ctx.data;
      if (_.isObject(obj)) {
        this.getRelationModelIds().forEach(function (modelId) {
          if (!obj.hasOwnProperty(modelId)) {
            var data = ctx.instance ? ctx.instance[modelId]() : null;
            if (!data && ctx.data && ctx.data.hasOwnProperty(modelId)) {
              data = ctx.data[modelId];
            }
            if (data) {
              obj[modelId] = data;
            }
          }
        });
      }
      return obj;
    };

    /**
     * Get model ids from relation type
     *
     * @param   {array} [relationTypes=['hasMany', 'hasOne']]
     * @returns {Array}
     */
    Model.getRelationModelIds = function (relationTypes) {
      relationTypes = relationTypes || ['hasMany', 'hasOne'];
      var ids = [];
      var relations = this.relations && !_.isEmpty(this.relations) ? this.relations : this.settings.relations;
      _.each(relations, function (relation, id) {
        if (_.indexOf(relationTypes, relation.type) !== -1) {
          ids.push(id);
        }
      });
      return ids;
    };

    /**
     * Get models which have a relation type `belongsTo` this Model
     *
     * @return {array}
     */
    Model.getModelsBelongsToThisModel = function () {
      var models = [];
      app.models().forEach(function (model) {
        for (var i in model.relations) {
          var relation = model.relations[i];
          if (relation.type === 'belongsTo' && relation.modelTo.modelName === Model.modelName) {
            models.push(model);
            break;
          }
        }
      });
      return models;
    };

    /**
     * After model is initialized
     * Overwrite `find` method, include related model properties by using the include filter
     */
    if (Model.getRelationModelIds().length > 0) {
      Model.afterInitialize = function () {
        var find = Model.find;
        Model.find = function () {
          var args = arguments;
          var includes = {include: Model.getRelationModelIds()};
          if (args.length === 1) {
            args = [includes, args[0]];
          } else {
            args[0] = _.isObject(args[0]) ? _.extend(args[0], includes) : includes;
          }
          find.apply(Model, args);
        };
      };
    }

    /**
     * After delete event on Model instance
     * Remove related models with attached BaseModel id
     *
     * @param {object}    ctx
     * @param {function}  next
     */
    Model.observe('after delete', function (ctx, next) {
      var instanceId = ctx.where.id;

      // delete has many relations from current model
      var deleteHasManyRelationsFromCurrentModel = function () {
        var deferred = Q.defer(), count = 0, relatedModelIds = Model.getRelationModelIds();
        if (relatedModelIds.length > 0) {
          relatedModelIds.forEach(function (modelId) {
            var where = {};
            where[Model.relations[modelId].keyTo] = instanceId;
            Model.getRelatedModelFromSettingsModelId(modelId).destroyAll(where, function (err) {
              if (err) return deferred.reject(err);
              count++;
              if (count === relatedModelIds.length) {
                deferred.resolve();
              }
            });
          });
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      // delete belongsTo this Model of other models
      var deleteBelongsToRelationsFromOtherModels = function () {
        var deferred = Q.defer(), count = 0, belongsToModels = Model.getModelsBelongsToThisModel();
        if (belongsToModels.length > 0) {
          Model.getModelsBelongsToThisModel().forEach(function (model) {
            var key, where = {};
            for (var id in model.relations) {
              var relation = model.relations[id];
              if (relation.type === 'belongsTo' && relation.modelTo.modelName === Model.modelName) {
                key = relation.keyFrom;
                break;
              }
            }
            where[key] = instanceId;
            model.destroyAll(where, function (err) {
              if (err) return deferred.reject(err);
              count++;
              if (count === belongsToModels.length) {
                deferred.resolve();
              }
            });
          });
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };

      deleteHasManyRelationsFromCurrentModel().then(function () {
        return deleteBelongsToRelationsFromOtherModels();
      }).then(next).fail(next).done();
    });

    /**
     * Before delete model instance
     * Validate property provided `id`
     *
     * @param {object}          ctx
     * @param {PersistedModel}  instance
     * @param {function}        next
     */
    Model.beforeRemote('deleteById', function (ctx, instance, next) {
      Model.findById(ctx.args.id, function (err, result) {
        if (err || _.isNull(result)) {
          var _err = new Error(util.format('Unknown "%s" id "%s"', Model.modelName, ctx.args.id));
          _err.statusCode = 404;
          _err.code = 'MODEL_NOT_FOUND';
          next(_err);
        } else {
          next();
        }
      });
    });

    /**
     * Remove empty properties from remote result object
     * remoteMethods `find`, `findOne` and `findById`
     */
    Model.afterRemote('find', removeEmptyResultProperties);
    Model.afterRemote('findOne', removeEmptyResultProperties);
    Model.afterRemote('findById', removeEmptyResultProperties);
  };
};
