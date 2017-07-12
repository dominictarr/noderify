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
    console.error('not fonid', p, err)
    return false
  }
}

function pkgRoot (file) {
  var dir = path.dirname(file)
    , prev

  while (true) {
    console.error('PKG_ROOT', dir)
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
//    globalTransform: function (file, opts) {
//      return through(function (chunk, enc, cb) {
//        chunk += ''
//        var s = this
//        var m = chunk.match(/require\(.bindings.\)\(.([\-_a-zA-Z0-9.]+).\)/)
//        if (m) {
//          var basedir = pkgRoot(file)
//          var n = m[1].substr(-5) === '.node' ? m[1] : m[1]+ '.node'
//          resolve('./build/Release/'+n, {basedir: pkgRoot(file), extensions: ['.node']},
//            function (err, p) {
//              chunk = chunk.replace(m[0], "require('./"+path.relative(basedir, p)+"')")
//              s.push(chunk)
//              cb()
//            })
//        } else {
//          s.push(chunk)
//          cb()
//        }
//      })
//    },
    filter: function (s) {
      return (!~opts.filter.indexOf(s)) && opts.replace[s] !== false
    },
    resolve: function (required, module, cb) {
//      console.error(opts.replace)
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
      // secret magic sauce
//      for (var id in opts.replace) {
//        e.source = e.source.replace(new RegExp("require\\(\\'"+id+"\\'\\)", 'g'), "require('./"+opts.replace[id]+"')")
//      }

      try {
        JSON.parse(e.source)
        e.source = 'module.exports = ' + e.source
      } catch (e) { }

      for(var k in e.deps) {
        // console.error(e.id, k, e.deps[k])
        if(!e.deps[k])
          delete e.deps[k]
        else
          e.deps[k] = path.relative(process.cwd(), e.deps[k])
      }
    })
}

module.exports = function (opts, cb) {
  console.error('NODERIFY', opts)
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



