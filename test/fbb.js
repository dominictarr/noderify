

//test replacing foo-bar-baz

console.log('test wether a replaced module actually loads submodules!')
console.log(require('util').inspect(require('../package.json')))
