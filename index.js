#! /usr/bin/env node

var path = require('path')
var fs = require('fs')
var moduleDeps = require('module-deps')
var resolve = require('resolve')

//hard coded modules that get replaced.
//core modules or modules with c bits.
//Obviously, this should be fixed so it's not hardcoded.
var filter = [
  'sodium', 'chloride', 'path', 'fs', 'leveldown', 'net'
]

var deps = moduleDeps({
  ignoreMissing: true,
  filter: function (s) {
    return !~filter.indexOf(s)
  },
  resolve: function (a, b, cb) {
    return resolve (a, {basedir: path.dirname(b.filename)},
      function (err, path) {
        cb(null, /^\//.test(path) ? path : null)
    })
  },
  postFilter: function (id, file, pkg) {
    //return true
    return !!file
  }
})
  .on('data', function (e) {
    e.source = e.source.replace(/^\s*#![^\n]*/, '\n')
    try {
      JSON.parse(e.source)
      e.source = 'module.exports = ' + e.source
    } catch (e) { }

    for(var k in e.deps) {
      console.error(e.id, k, e.deps[k])
      if(!e.deps[k])
        delete e.deps[k]
    }
  })

// hacks to make browser-pack work with node
var preludePath = path.join(__dirname, 'prelude.js')

;(function () {
  var bpackPath = path.join(__dirname, 'node_modules', 'browser-pack', 'index.js')
  var src = fs.readFileSync(bpackPath, 'utf-8')
  if (~src.indexOf('wrappedSource')) {
    src = src.replace(/wrappedSource/g, 'warpedSource')
    src = src.replace('function(require,module,exports){\\n', 'function(require,module,exports,__dirname,__filename){\\n')
    src = src.replace(
      "            ']'", [
      "            ',\\n',",
      "            JSON.stringify(row.id),",
      "            ',\\n',",
      "            JSON.stringify(path.dirname(row.id)),",
      "            '\\n]'",
      ].join('\n')
    )
    fs.writeFileSync(bpackPath, src)
  }
}())

deps
  .pipe(require('browser-pack')({raw: true, prelude: fs.readFileSync(preludePath, 'utf-8'), preludePath: preludePath}))
  .pipe(process.stdout)

deps.end(process.argv[2] ? path.resolve(process.argv[2]) : __filename)
