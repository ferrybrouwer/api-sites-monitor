var Q = require('q');

/**
 * Create admin user used for Authentication REST endpoints
 *
 * @param {LoopBack Application}  app
 * @param {function}              callback
 */
module.exports = function (app, callback) {

  /**
   * Delete user by email
   *
   * @param   {string} email
   * @returns {*}
   */
  var deleteUserByEmail = function (email) {
    var deferred = Q.defer();
    app.models.User.destroyAll({email: email}, function (err) {
      if (err) return deferred.reject(err);
      deferred.resolve();
    });
    return deferred.promise;
  };

  /**
   * Create an user
   *
   * @param   {object} credentials
   * @returns {*}
   */
  var createUser = function (credentials) {
    var deferred = Q.defer();
    app.models.User.create(credentials, function (err, user) {
      if (err) return deferred.reject(err);
      deferred.resolve(user);
    });
    return deferred.promise;
  };

  /**
   * Create admin user role
   *
   * @param   {User} user
   * @returns {*}
   */
  var createAdminUserRole = function (user) {
    var deferred = Q.defer();
    app.models.Role.create({name: 'admin'}, function (err, role) {
      if (err) return deferred.reject(err);
      role.principals.create({
        principalType: app.models.RoleMapping.USER,
        principalId:   user.id
      }, function (err, principal) {
        if (err) return deferred.reject(err);
        deferred.resolve(principal);
      });
    });
    return deferred.promise;
  };

  // admin credentials
  var credentials = {
    username: app.get('credentials').username,
    email:    app.get('credentials').email,
    password: app.get('credentials').password
  };

  // create admin user used for Authentication REST endpoints
  deleteUserByEmail(credentials.email)
    .then(function () { return createUser(credentials); })
    .then(function (user) { return createAdminUserRole(user); })
    .then(function () {
      callback();
    }).fail(function (err) {
      throw err;
    }).done();


};
