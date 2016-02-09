/**
 *      _         _                  _                 _
 *     / \  _   _| |_ ___  _ __ ___ (_) __ _ _ __ __ _| |_ ___
 *    / _ \| | | | __/ _ \| '_ ` _ \| |/ _` | '__/ _` | __/ _ \
 *   / ___ \ |_| | |_ (_) | | | | | | | (_| | | | (_| | |_  __/
 *  /_/   \_\__,_|\__\___/|_| |_| |_|_|\__, |_|  \__,_|\__\___|
 *                                     |___/
 *
 * Auto-migrate script for creating sample data in database
 * --------------------------------------------------------------
 *
 * @see:    http://apidocs.strongloop.com/loopback-datasource-juggler/#datasourceautomigratemodel-callback
 * @note:   all existing data will be removed in selected datasource
 * @author: Ferry Brouwer <ferry@happy-online.nl>
 */

'use strict';

var path  = require('path'),
    async = require('async'),
    _     = require('lodash'),
    Q     = require('q');

var app    = require(path.resolve(__dirname, '../server')),
    helper = require(path.resolve(__dirname, '../../test/helper'));

var datasource = helper.getDatasource() ? app.datasources[helper.getDatasource().name] : null;

/**
 * Create sample sites
 * Automigrate database fields
 *
 * @param {function} db   Callback function
 */
function createSites(cb) {
  datasource.automigrate('Site', function (err) {
    if (err) cb(err);

    app.models.Site.create([
      helper.getMockModel('Site')
    ], cb);
  });
}

/**
 * Create sample form types
 * Automigrate database fields
 *
 * @param {function} cb   Callback function
 */
function createFormTypes(cb) {
  datasource.automigrate('FormType', function (err) {
    if (err) cb(err);

    app.models.FormType.create([
      helper.getMockModel('FormType')
    ], cb);
  });
}

/**
 * Create sample site forms when sites and form-types are available
 * Automigrate database fields
 *
 * @param {array} sites
 * @param {array} formTypes
 * @param {function} cb   Callback function
 */
function createSiteForms(sites, formTypes, cb) {
  datasource.automigrate('SiteForm', function (err) {
    if (err) cb(err);

    app.models.SiteForm.create([
      _.extend(helper.getMockModel('SiteForm'), {
        siteId:     sites[0].id,
        formTypeId: formTypes[0].id
      })
    ], cb);
  });
}

/**
 * Create sample site test form when -tests and site forms are available
 * Automigrate database fields
 *
 * @param {array} siteTests
 * @param {array} siteForms
 * @param {function} cb
 */
function createSiteTestForms(siteTests, siteForms, cb) {
  datasource.automigrate('SiteTestForm', function (err) {
    if (err) cb(err);

    app.models.SiteTestForm.create([
      _.extend(helper.getMockModel('SiteTestForm'), {
        siteTestId: siteTests[0].id,
        siteFormId: siteForms[0].id
      })
    ], cb);
  });
}

/**
 * Create sample site-test-psi's when site tests are available
 * Automigrate database fields
 *
 * @param {array} siteTests
 * @param {function} cb
 */
function createSiteTestPsis(siteTests, cb) {
  datasource.automigrate('SiteTestPsi', function (err) {
    if (err) cb(err);

    app.models.SiteTestPsi.create([
      _.extend(helper.getMockModel('SiteTestPsi'), {
        siteTestId: siteTests[0].id
      })
    ], cb);
  });
}

/**
 * Create sample site test pings
 * Automigrate database fields
 *
 * @param {array} siteTests
 * @param {function} cb
 */
function createSiteTestPings(siteTests, cb) {
  datasource.automigrate('SiteTestPing', function (err) {
    if (err) cb(err);

    app.models.SiteTestPing.create([
      _.extend(helper.getMockModel('SiteTestPing'), {
        siteTestId: siteTests[0].id
      })
    ], cb);
  });
}

/**
 * Create sample site tests when sites are available
 * Automigrate database fields
 *
 * @param {array} sites
 * @param {function} cb
 */
function createSiteTests(sites, cb) {
  datasource.automigrate('SiteTest', function (err) {
    if (err) cb(err);

    app.models.SiteTest.create([
      _.extend(helper.getMockModel('SiteTest'), {
        siteId:     sites[0].id,
        customData: {
          test: 'test string'
        }
      })
    ], cb);
  });
}

/**
 * Auto-migrate
 * @returns {promise}
 */
var automigrate = function () {
  var deferred = Q.defer();

  // first create sites and formTypes
  async.parallel({
    sites:     async.apply(createSites),
    formTypes: async.apply(createFormTypes)
  }, function (err, result) {
    if (err) {
      deferred.reject(err);
    }

    // generate site forms and site tests
    async.parallel({
      siteTests: async.apply(createSiteTests.bind(null, result.sites)),
      siteForms: async.apply(createSiteForms.bind(null, result.sites, result.formTypes))
    }, function (err, result) {
      if (err) {
        deferred.reject(err);
      }

      // generate -ping, -psi and site test forms
      async.parallel({
        siteTestForms: async.apply(createSiteTestForms.bind(null, result.siteTests, result.siteForms)),
        siteTestPsis:  async.apply(createSiteTestPsis.bind(null, result.siteTests)),
        siteTestPing:  async.apply(createSiteTestPings.bind(null, result.siteTests))
      }, function (err, result) {
        if (err) {
          deferred.reject(err);
        }

        // show notification and exit process
        deferred.resolve('Models created successfully!');
      });
    });
  });

  return deferred.promise;
};

// access through console
if (require.main === module) {
  automigrate()
    .then(function (msg) {
      console.log(msg);
      process.exit(0);
    })
    .fail(function (err) {
      console.error(err);
      process.exit(1);
    })
    .done();
}

module.exports = automigrate;
