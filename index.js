#! /usr/bin/env node

var path = require('path')
var join = path.join
var fs = require('fs')
var moduleDeps = require('module-deps')
var resolve = require('resolve')
var through = require('through2')
var nodepack = require('nodepack')

// io.js native modules
var native_modules = [
  'assert', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'dns', 'domain', 'events',
  'freelist', 'fs', 'http', 'https', 'module', 'net', 'os',
  'path', 'process', 'punycode', 'querystring', 'readline',
  'repl', 'smalloc', 'stream', 'string_decoder', 'sys',
  'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib'
]

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    f: 'filter',
    p: 'prelude',
    v: 'version'
  }
})

if(argv.version)
  return console.log(require('./package.json').version)

var filter = [].concat(argv.filter).concat(native_modules)

function exists (p) {
  try {
    (fs.accessSync || fs.statSync)(p)
    return true
  } catch (err) {
    return false
  }
}

function pkgRoot (file) {
  var dir = path.dirname(file)
    , prev
  while (true) {
    if (exists(join(dir, 'package.json')) || exists(join(dir, 'node_modules')))
      return dir

    if (prev === dir) {
      throw new Error('Could not find module root for ' + file)
    }

    prev = dir
    dir = join(dir, '..')
  }
}

var entry = argv._[0] ? path.resolve(argv._[0]) : __filename
var replace = {}
var deps = moduleDeps({
  ignoreMissing: true,
  globalTransform: function (file, opts) {
    return through(function (chunk, enc, cb) {
      chunk += ''
      var s = this
      var m = chunk.match(/require\(.bindings.\)\(.([\-_a-zA-Z0-9.]+).\)/)
      if (m) {
        var basedir = pkgRoot(file)
        var n = m[1].substr(-5) === '.node' ? m[1] : m[1]+ '.node'
        resolve('./build/Release/'+n, {basedir: pkgRoot(file), extensions: ['.node']},
          function (err, p) {
            chunk = chunk.replace(m[0], "require('./"+path.relative(basedir, p)+"')")
            s.push(chunk)
            cb()
          })
      } else {
        s.push(chunk)
        cb()
      }
    })
  },
  filter: function (s) {
    return !~filter.indexOf(s)
  },
  resolve: function (a, b, cb) {
    return resolve (a, {basedir: path.dirname(b.filename), extensions: ['.js', '.json', '.node']},
      function (err, file) {
        if (file) {
          if (file[0] !== '/') {
            var c = a.split('/')[0]
            if (c[0] !== '.') console.error('missing dependency. need to install:', c)
          } else if (file && file.substr(-5) === '.node') {
            replace[a] = path.relative(path.dirname(entry), file)
            return cb(null, null)
          }
        }

        cb(null, /^\//.test(file) ? file : null)
    })
  },
  postFilter: function (id, file, pkg) {
    return !!file
  }
})
  .on('data', function (e) {
    e.source = e.source.replace(/^\s*#![^\n]*/, '\n')
    // secret magic sauce
    for (var id in replace) {
      e.source = e.source.replace(new RegExp("require\\(\\'"+id+"\\'\\)", 'g'), "require('./"+replace[id]+"')")
    }

    try {
      JSON.parse(e.source)
      e.source = 'module.exports = ' + e.source
    } catch (e) { }

    for(var k in e.deps) {
      // console.error(e.id, k, e.deps[k])
      if(!e.deps[k])
        delete e.deps[k]
    }
  })

var opts = {raw: true}
if (argv.prelude) {
  var preludePath = path.resolve(argv.prelude)
  opts.prelude = fs.readFileSync(preludePath, 'utf-8')
  opts.preludePath = preludePath
}

deps
  .pipe(nodepack(opts))
  .pipe(process.stdout)

deps.end(entry)
