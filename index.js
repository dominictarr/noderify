#! /usr/bin/env node

var path = require('path')
var join = path.join
var fs = require('fs')

// io.js native modules
var native_modules = [
  'assert', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'dns', 'domain', 'events',
  'freelist', 'fs', 'http', 'https', 'module', 'net', 'os',
  'path', 'process', 'punycode', 'querystring', 'readline',
  'repl', 'smalloc', 'stream', 'string_decoder', 'sys',
  'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib'
]

var electron_modules = [
  'app', 'auto-updater', 'browser-window', 'content-tracing',
  'dialog', 'global-shortcut', 'ipc', 'menu', 'menu-item',
  'power-monitor', 'power-save-blocker', 'protocol', 'tray',
  'remote', 'web-frame', 'clipboard', 'crash-reporter',
  'native-image', 'screen', 'shell'
]

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    f: 'filter',
    p: 'prelude',
    v: 'version',
    e: 'electron',
    'ignore-missing': 'ignoreMissing'
  },
  boolean: ['electron', 'version']
})

if(argv.electron) argv.shebang = false

if(argv.version)
  return console.log(require('./package.json').version)

var filter = [].concat(argv.filter)
              .concat(native_modules)
              .concat(argv.electron ? electron_modules : [])

if(!argv._[0]) {
  console.error('usage: noderify entry.js > bundle.js')
  process.exit(1)
}

var entry = path.resolve(argv._[0])

var replace = {}

if(argv.shebang !== false)
  console.log('#! /usr/bin/env node')

//deps
//  .pipe(deterministic(function (err, content, deps, entry) {
//      if(err) throw err
//      console.log(pack(content, deps, entry))
//    }))
//
//deps.end(entry)

require('./inject')({
  entry: entry,
  filter: filter,
  replace: argv.replace || {},
  ignoreMissing: argv.ignoreMissing
}, function (err, src) {
  if(err) throw err
  console.log(src)
})
