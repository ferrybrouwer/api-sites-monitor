var _     = require('lodash'),
    Q     = require('q'),
    path  = require('path'),
    fs    = require('fs'),
    mocks = require('./mock.json');

function Helper() {}

/**
 * Create formtype
 *
 * @returns {Promise}
 */
Helper.createFormType = function () {
  var deferred = Q.defer();
  app.models.FormType.create(Helper.getMockModel('FormType'), function (err, formtype) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(formtype);
    }
  });
  return deferred.promise;
};

/**
 * Create site
 *
 * @returns {Promise}
 */
Helper.createSite = function () {
  var deferred = Q.defer();
  app.models.Site.create(Helper.getMockModel('Site'), function (err, site) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(site);
    }
  });
  return deferred.promise;
};

/**
 * Create siteForm
 *
 * @returns {Promise}
 */
Helper.createSiteForm = function () {
  var deferred = Q.defer();
  var site;
  Helper.createSite()
    .then(function (_site) {
      site = _site;
      return Helper.createFormType();
    })
    .then(function (formtype) {
      var mock = _.extend(Helper.getMockModel('SiteForm'), {
        siteId:     site.id,
        formTypeId: formtype.id
      });

      app.models.SiteForm.create(mock, function (err, siteform) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(siteform);
        }
      });
    })
    .fail(deferred.reject)
    .done();
  return deferred.promise;
};

/**
 * Create site test
 *
 * @param     {object}  data
 * @returns   {Promise}
 */
Helper.createSiteTest = function (data) {
  var deferred = Q.defer();
  Helper.createSiteForm()
    .then(function (siteform) {
      data = _.extend({siteId: siteform.siteId}, data || null);

      if (data.hasOwnProperty('forms')) {
        data.forms.forEach(function (form) {
          form.siteFormId = siteform.id;
        });
      }

      app.models.SiteTest.create(_.extend(Helper.getMockModel('SiteTest'), data), function (err, sitetest) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(sitetest);
        }
      });
    })
    .fail(deferred.reject)
    .done();
  return deferred.promise;
};

/**
 * Get datasource from config file
 *
 * @returns {object|null}
 */
Helper.getDatasource = function () {
  var datasources, modelconfig, datasource;

  // get datasources
  var datasourcesPath = path.resolve(__dirname, '../server') + '/datasources.json';
  var datasourcesPathTest = path.resolve(__dirname, '../server') + '/datasources.' + process.env.NODE_ENV + '.json';
  datasources = fs.existsSync(datasourcesPathTest) ? require(datasourcesPathTest) : require(datasourcesPath);

  // get modelconfig
  var modelConfigPath = path.resolve(__dirname, '../server') + '/model-config.json';
  var modelConfigPathTest = path.resolve(__dirname, '../server') + '/model-config.' + process.env.NODE_ENV + '.json';
  modelconfig = fs.existsSync(modelConfigPathTest) ? require(modelConfigPathTest) : require(modelConfigPath);

  // get datasource of `Site` model
  var SiteDatasource = modelconfig.Site.dataSource;

  // get datasource object
  for (var i in datasources) {
    var ds = datasources[i];
    if (ds.name === SiteDatasource) {
      datasource = ds;
      break;
    }
  }

  return datasource || null;
};

/**
 * Get user token id
 *
 * @return {Promise}
 */
Helper.getUserTokenId = function () {
  var deferred = Q.defer();
  app.models.User.login(app.get('credentials'), function (err, token) {
    if (err) return deferred.reject(err);
    deferred.resolve(token.id);
  });
  return deferred.promise;
};

/**
 * Get mock of model by modelName
 *
 * @param     {string} modelName
 * @returns   {object}
 */
Helper.getMockModel = function (modelName) {
  return mocks.hasOwnProperty(modelName) ? _.clone(mocks[modelName]) : {};
};

module.exports = Helper;
