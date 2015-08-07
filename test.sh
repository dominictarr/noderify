#! /bin/bash

# use noderify to bundle itself, then check that the bundled
# version can still bundle noderify and get the exact same bundle.

set -e # exit with an error if any command fails
node index.js index.js > _b.js
node _b.js index.js > _b2.js
shasum _*.js

diff _b.js _b2.js

#tidy up
rm _*.js
