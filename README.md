# Controllency
Launch concurrent functions (Promises) in a controlled way.

[![Build Status](https://travis-ci.org/davloperez/controllency.svg?branch=master)](https://travis-ci.org/davloperez/controllency)
[![Node Version](https://img.shields.io/badge/node-v6.10.0-blue.svg?style=flat)](https://nodejs.org/en/blog/release/v6.10.0/)
[![Coverage](https://img.shields.io/badge/coverage-100%25-green.svg?style=flat)](https://nodejs.org/en/blog/release/v6.10.0/)

![Demo example](http://g.recordit.co/uTN2oS1PhW.gif)
View demo in [JSFiddle](https://jsfiddle.net/yzxre6fu/1/)

With this module you can control how many promises are being executed at the same time when you have a large quantity of them. You can do things like:
> Hey Controllency, launch all these hundreds of Promises, but execute 3 of them as maximum at once. Take the time you need. And please, signal me whenever some of them finishes.

Controllency uses a little in-memory "queue" to store the pending promises to be executed as soon as possible. You can push new promises while the previous ones are still being executed or queued to be executed. When a Promise is resolved or rejected, Controllency emit an event which you can suscribe to if you need to know the succeed result or the failing reason.

Here there is a simple schema about how Controllency works:

![controllency_schema](https://user-images.githubusercontent.com/1970817/29745407-f866efe2-8ab9-11e7-9e73-8ced94bee93a.jpg)


## Installation
```
npm install controllency --save
```
## Usage
Example 1: basic usage
```typescript
import { Controllency } from 'controllency';

let controllency = new Controllency({ maxConcurrency: 2 });

seriallency.push({ fn: hardWorkFn, params: [1]});
seriallency.push({ fn: hardWorkFn, params: [2]});
seriallency.push({ fn: hardWorkFn, params: [3]});
seriallency.push({ fn: hardWorkFn, params: [4]});
seriallency.push({ fn: hardWorkFn, params: [5]});
seriallency.push({ fn: hardWorkFn, params: [6]});

function hardWorkFn(numParam: number): Promise<any>{
    console.log(`Executing hardWorkFn. numParam:${numParam}`);
    return new Promise(resolve => {
        // ... do some async process
        setImmediate(resolve);
    });
}

// If we supose that hardWorkFn returned promise takes 1 second to be resolved, output is:
// At second 0: Executing hardWorkFn. numParam: 1
// At second 0: Executing hardWorkFn. numParam: 2
// At second 1: Executing hardWorkFn. numParam: 3
// At second 1: Executing hardWorkFn. numParam: 4
// At second 2: Executing hardWorkFn. numParam: 5
// At second 2: Executing hardWorkFn. numParam: 6
```