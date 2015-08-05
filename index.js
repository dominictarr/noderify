#! /usr/bin/env node

var path = require('path')
var moduleDeps = require('module-deps')
var resolve = require('resolve')
var Pack = require('nodepack')

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

deps
  .pipe(Pack({raw: true}))
  .pipe(process.stdout)

deps.end(process.argv[2] ? path.resolve(process.argv[2]) : __filename)
