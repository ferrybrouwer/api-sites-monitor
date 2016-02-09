var _        = require('lodash'),
    loopback = require('loopback'),
    app      = require('../../server/server');

/**
 * BaseSiteTestModel
 * Base model for Related SiteTest Models
 *
 * @param {PersistedModel} BaseSiteTestModel
 */
module.exports = function (BaseSiteTestModel) {

  /**
   * Setup Base Test Model
   * The setup method is used for Classes extending this Model
   *
   * @this {BaseSiteTestModel}
   * @constructor
   */
  BaseSiteTestModel.setup = function () {
    var Model = this;
    loopback.getModel('BaseModel').setup.call(this);

    /**
     * Validate instance
     * Should contain a `siteTestId` property
     */
    Model.validatesPresenceOf('siteTestId', {
      message: 'Should contains a siteTestId'
    });

    /**
     * Validate instance
     * Should contain a valid `siteTestId` property
     *
     * @param {function} _err
     * @param {function} done
     */
    Model.validateAsync('siteTestId', function (_err, done) {
      loopback.getModel('SiteTest').findById(this.siteTestId, function (err, result) {
        if (_.isNull(result)) {
          _err();
        }
        done();
      });
    }, {
      message: 'Invalid siteTestId',
      code:    'invalid'
    });

    /**
     * Before save model instance
     * Remove existing model instances with current `siteTestId`
     *
     * @param {object}    ctx
     * @param {function}  next
     */
    Model.observe('before save', function (ctx, next) {
      var siteTestId = ctx[ctx.instance ? 'instance' : 'data'].siteTestId;
      if (siteTestId) {
        Model.destroyAll({siteTestId: siteTestId}, next);
      } else {
        next();
      }
    });

    /**
     * Set belongs to SiteTest Model after it's attached to the app
     * with foreign key `siteTestId`
     */
    Model.on('attached', function () {
      Model.belongsTo(loopback.getModel('SiteTest'), {
        foreignKey: 'siteTestId'
      });
    });
  };
};
