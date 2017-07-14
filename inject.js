var moduleDeps = require('module-deps')
var resolve = require('resolve')
var through = require('through2')
var sort = require('sort-stream')
var deterministic = require('./deterministic')
var pack = require('./pack')
var path = require('path')
var fs = require('fs')

function exists (p) {
  try {
    (fs.accessSync || fs.statSync)(p)
    return true
  } catch (err) {
    console.error('not found', p, err)
    return false
  }
}

function pkgRoot (file) {
  var dir = path.dirname(file)
    , prev

  while (true) {
    if (exists(path.join(dir, 'package.json')) || exists(path.join(dir, 'node_modules')))
      return dir

    if (prev === dir) {
      throw new Error('Could not find module root for ' + file)
    }

    prev = dir
    dir = path.join(dir, '..')
  }
}



function createDepStream(opts) {

  return moduleDeps({
    ignoreMissing: opts.ignoreMissing,
    filter: function (s) {
      return (!~opts.filter.indexOf(s)) && opts.replace[s] !== false
    },
    resolve: function (required, module, cb) {
      if(opts.replace && opts.replace[required]) {
        required = opts.replace[required]
      }
      if(opts.replace[required] === false) throw new Error('should not resolve:'+required)
      return resolve (required, {
          basedir: path.dirname(module.filename),
          extensions: ['.js', '.json', '.node']
        },
        function (err, file) {
          if(err) return cb (err)
          if (file) {
            if (file[0] !== '/') {
              var c = required.split('/')[0]
              if (c[0] !== '.') console.error('missing dependency. need to install:', c)
            } else if (file && file.substr(-5) === '.node') {
              opts.replace[required] = path.relative(path.dirname(opts.entry), file)
              return cb(null, null)
            }
          }

          cb(null, /^\//.test(file) ? file : null)
      })
    },
    postFilter: function (id, file, pkg) {
      if(/\.node$/.test(id)) console.error(id, file)

      return file || !(/\.node$/.test(id))
    }
  })
    .on('data', function (e) {
      e.id = path.relative(process.cwd(), e.id)
      e.source = e.source.replace(/^\s*#![^\n]*/, '\n')

      try {
        JSON.parse(e.source)
        e.source = 'module.exports = ' + e.source
      } catch (e) { }

      for(var k in e.deps) {
        if(!e.deps[k])
          delete e.deps[k]
        else
          e.deps[k] = path.relative(process.cwd(), e.deps[k])
      }
    })
}

module.exports = function (opts, cb) {
  var deps = createDepStream(opts)
  deps
  .pipe(deterministic(function (err, content, deps, entry) {
      if(err) cb(err)
      else cb(null,
        (opts.shebang !== false ? '#! /usr/bin/env node\n' : '') + 
        pack(content, deps, entry)

      )
    }))
  deps.end(opts.entry)
}

