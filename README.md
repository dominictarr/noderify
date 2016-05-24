# noderify

browserify for the server side.

## Why would you do this?

node modules are great,
and make it easy to reuse lots and lots of openly available modules.
But node loads these modules synchronously, so if you have an application
with _many_ modules, just loading the code may take a significant time.

If you have a spinning disk, this may be very unpleasant,
and even if you have a SSD it may still be slow enough to not feel "snappy"

on my computer (ThinkPad X220, with spinning disk)

```
time npm --version
2.13.2

real    0m2.384s
user    0m0.530s
sys     0m0.043s

# okay...

time browserify --version
6.2.0

real    0m3.014s
user    0m0.950s
sys     0m0.097s

# too slow...


time npmd --version
1.3.3

real    0m7.447s
user    0m1.240s
sys     0m0.157s

# wow too slow

time node sbot version # (scuttlebot)
6.1.0

real    0m9.103s
user    0m1.120s
sys     0m0.187s

# WTF?

```

The reason this is so slow, is because each require blocks,
so if you have hundreds you have to wait for each one.
lets bundle this into one file, so we only read one file, and
then everything is in memory.

``` js
noderify scuttlebot/bin.js > b.js
time node b.js version
6.1.0

real    0m1.038s
user    0m0.553s
sys     0m0.033s

# that is MUCH better! 8.76 times faster!!!
```

## Usage

```
noderify
  -f mod                # excludes mod from the bundle
  -p prelude.js         # specify a custom prelude file (see nodepack's implementation for reference)

```

## how it works

noderify creates a javascript bundle with a different arrangement to browserify.
the first thing is a `prelude` function which takes content and structure
of the bundle and assembles it together (injecting `require` and `module` variables, etc)
this function is self-evaluating so running the javascript bundle runs the program.

``` js
prelude(content, dependencies, entry)
```

`content` is a content addressed mapping from the _base64 encoded sha256 hash of each content file_ to that file (as a module closure)
in node.js modules, a given file may be used multiple times,
and might even have different names. Since the content is hashed,
if different versions of a single module occur, but have different names,
they are not duplicated.

``` js
content = {<hash(file)>: <file>, ..}
```

`dependencies` represents the dependency tree. It is a mapping of
`filename` to the content hash (so it can be looked up in the `content` object)
and then that file's internal dependencies. the file's dependencies
map from the dependency expression within that file (it could be relative
like `require('./lib/util.js')` or to an installed module like `require('minimist')`
by pointing to the actual filename that expression maps to, the noderify
prelude function does not require an internal model of the file system,
it can simply look up the mappings for each file.

``` js
dependencies = {
  <filename>: [hash(file), { <relative_require>: <filename>, ...}]
}
```

`entry` is just the file name in the dependency tree to call first.

## TODO - dynamic linker

noderify (like browserify) is essentially a [_static linker for javascript_](https://en.wikipedia.org/wiki/Static_library)
for certain applications, it would be interesting to have a _dynamic linker_.
In particular, for something like [depject](https://github.com/dominictarr/depject)
a dynamic linker could combine multiple dependency trees into a single bundle.

## License

MIT



