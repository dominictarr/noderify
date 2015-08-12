
function prelude (content, deps, entry) {
  var cache = {}

  function load (file) {
    var d = deps[file]
    if(cache[file]) return cache[d]
    if(!d) return require(file)
    var fn = content[d[0]] //the actual module
    var module = {exports: {}, parent: file !== entry}
    return cache[file] = fn(
      function (m) {
        if(!deps[file][m]) return require(m)
        else               return load (deps[file][m])
      },
      module,
      module.exports,
      file.substring(file.lastIndexOf('/')),
      file
    )
  }

  return load(entry)
}

module.exports = function (content, deps, entry) {
  return (
    '('+prelude.toString()+')('
    + (function () {
        var s = '{\n'
        for(var k in content) {
          s += [
            JSON.stringify(k)+':\n', 
            'function (require, module, exports, __dirname, __filename) {\n',
            content[k],
            '\n},\n'
          ].join('')
        }
        return s+'\n}\n'
      })()
    + ',\n'
    + JSON.stringify(deps, null, 2)
    + ',\n'
    + JSON.stringify(entry)
    + ')'
  )
}
