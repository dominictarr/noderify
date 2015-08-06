# noderify

browserfy for the server side.

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

## TODO

This was hacked up before a talk about secure-scuttlebutt
so that I could demo it without embarassment ;)
working, but not 100% yet!

## License

MIT
