var dbapi = require('../../../db/api')
var wireutil = require('../../../wire/util')

module.exports = function(socket, next) {
  var req = socket.request
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
