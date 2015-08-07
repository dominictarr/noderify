

function prelude (content, deps, entry) {
  var cache = {}

  return (function newRequire (file) {
    var d = deps[file]
    var m = content[d[0]] //the actual module
    var module = {exports: {}, parent: file !== entry}
  })(entry)
}

module.exports = function (content, deps, entry) {
  return (
    '('+prelude.toString()+')('
    + (function () {
        var s = '{\n'
        for(var k in content) {
          s = s
          + JSON.stringify(k)+':\n'
          + 'function (require, module, exports, __dirname, __filename) {\n'+
          + content[k]
          + '\n},\n'
        }
        return s+'\n}\n'
      })
    + ',\n'
    + JSON.stringify(deps, null, 2)
    + ',\n'
    + JSON.stringify(entry)
    + ')'
  )
}
