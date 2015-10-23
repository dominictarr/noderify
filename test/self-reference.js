
// keep a global count of how many times this file is actually loaded.
global.COUNT = global.COUNT || 0
global.COUNT ++

var assert = require('assert')
var m = module.exports
assert.strictEqual(require('./self-reference'), m)

assert.equal(global.COUNT, 1)
