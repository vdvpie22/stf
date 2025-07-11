/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')

var dbapi = require('../../../db/api')
var wireutil = require('../../../wire/util')

module.exports = function(options) {
  return function(req, res, next) {
    dbapi.getRootGroup().then(function(rootGroup) {
      req.user = {
        email: 'admin@admin.com',
        name: 'admin',
        privilege: 'admin',
        group: wireutil.makePrivateChannel(),
        groups: { subscribed: [rootGroup.id] },
        settings: {},
        ip: req.ip
      }
      req.session = req.session || {}
      req.session.jwt = { email: 'admin@admin.com', name: 'admin' }
      next()
    })
  }
}
