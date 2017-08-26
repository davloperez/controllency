# controllency
Launch concurrent functions (Promises) in a controlled way.

[![Build Status](https://travis-ci.org/davloperez/controllency.svg?branch=master)](https://travis-ci.org/davloperez/controllency)
[![Build Status](https://img.shields.io/badge/node-v6.10.0-blue.svg?style=flat)](https://nodejs.org/en/blog/release/v6.10.0/)

With this module you can controll hoy many promises are being executed at the same time when you have a large quantity of them. You can do things like:
> Hey Controllency, launch all these hundreds of Promises, but execute 3 of them as maximum at once. Take the time you need. And please, signal me whenever some of them finishes.

Controllency uses a little in-memory "queue" to store the pending promises to be executed as soon as possible. You can push new promises while the previous ones are still being executed or queued to be executed. When a Promise is resolved or rejected, Controllency emit an event which you can suscribe to if you need to know the succeed result or the failing reason.
