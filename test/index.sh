
#! /bin/bash

# use noderify to bundle itself, then check that the bundled
# version can still bundle noderify and get the exact same bundle.

was_okay () {
  if [ $? -eq 0 ]; then
    echo Okay
  else
    echo NOT OKAY
    exit 1
  fi
}

okay () {
  "$@"
  was_okay
}


not_okay () {
  "$@"
  if [ $? -eq 0 ]; then
    echo okay
    exit 1
  else
    echo not_okay
  fi
}


tidy () {
  rm _*.js 2> /dev/null
}

echo $PWD
#cd $(dirname $BASH_SOURCE)

echo $PWD
tidy

noderify=./index.js
#//
#//  echo $noderify  "$file"
#//  time $noderify "$file" > _bundle.js
#//
#//  okay node _bundle.js

echo "Test module not found error:"
not_okay $noderify test/missing.js > /dev/null

$noderify test/self-reference.js > _bundle.js 
was_okay
okay node _bundle.js

echo "TEST NOT FOUND, but replace missing module"
$noderify test/missing.js --replace.foo-bar-baz=./fbb > _bundle.js 
was_okay
okay node _bundle.js

$noderify test/native.js --filter sodium-native --filter leveldown > _bundle.js 
was_okay
okay node _bundle.js


#done

#set -e # exit with an error if any command fails

echo noderify noderify
echo noderify $noderify > _b.js
time $noderify $noderify > _b.js

echo noderify noderify with the noderified noderify
time node _b.js $noderify > _b2.js

shasum _b.js _b2.js

okay diff _b.js _b2.js

not_okay node _b.js missing.js  2> /dev/null > /dev/null
echo "ignore missing"
okay node _b.js missing.js --ignore-missing 2> /dev/null > /dev/null

tidy



