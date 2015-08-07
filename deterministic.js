var through = require('through2')
var createHash = require('crypto').createHash

function hash(s) {
  return createHash('sha256').update(s).digest('base64')
}

function sort (obj) {
  var o = {}
  Object.keys(obj).sort().forEach(function (k) {
    o[k] = obj[k]
  })
  return o
}

module.exports = function (cb) {
  var entry = null
  var content = {}, files = {}
  return through.obj(function (data, enc, cb) {

    //address each unique file by it's hash
    content[data.sha256 = hash(data.source)] = data.source

    //map of which file has what hash, plus what deps it uses.
    files[data.id] = [data.sha256, data.deps]

    if(data.entry)
      entry = data.id

    cb()
  }, function () {
    cb(null,

      //{<hash>: source,...}
      content,

      //{<filename>: [<hash>, {<require>: <resolve-filename>}],..}
      files,

      //filename to start with.
      entry
    )

    this.push(null)
  })
}
