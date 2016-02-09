var path = require('path'),
    fs   = require('fs'),
    path = require('path'),
    app  = require('../server/server.js');

/**
 * Class Database
 * @constructor
 */
function Database() {
  this.datasource = this._getDatasource();

  before(this.createTestDatabase.bind(this));
  after(this.removeTestDatabase.bind(this));
}

Database.prototype = {
  constructor: Database,

  /**
   * Get datasource of test database
   *
   * @returns {object|null}
   * @private
   */
  _getDatasource: function () {
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
  },

  /**
   * Create test database
   */
  createTestDatabase: function () {
    it('Create test database', function (done) {
      require('../server/bin/automigrate')()
        .then(function (msg) {
          done();
        })
        .fail(function (err) {
          done(err);
        })
        .done();
    });
  },

  /**
   * Remove test database
   */
  removeTestDatabase: function () {
    app.datasources[this.datasource.name].connector.db.dropDatabase();
  }
};

module.exports = global.database = global.database || new Database();
