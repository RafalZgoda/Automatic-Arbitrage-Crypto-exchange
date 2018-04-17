# Pipez

[![Build Status](https://travis-ci.org/xpl/pipez.svg?branch=master)](https://travis-ci.org/xpl/pipez) [![Coverage Status](https://coveralls.io/repos/github/xpl/pipez/badge.svg)](https://coveralls.io/github/xpl/pipez) [![npm](https://img.shields.io/npm/v/pipez.svg)](https://npmjs.com/package/pipez) [![dependencies Status](https://david-dm.org/xpl/pipez/status.svg)](https://david-dm.org/xpl/pipez)

Pipez stands for _[purely functional](https://en.wikipedia.org/wiki/Purely_functional) pipelines_. A pipeline is a function composed of other functions, like a sequence. It takes some data as input and pushes it down through, transforming it on each stage until the final result is achieved. Each function's output is an input for the next function in a sequence, and so on.

This tiny [(~100 lines of code)](https://github.com/xpl/pipez/blob/master/pipez.js) library implements a novel way for describing it in modern JavaScript, proposing a framework that focuses on easy ad-hoc parameterization of a constructed utility, so you can build [incredibly configurable tools](https://github.com/xpl/ololog) with less pain.

## A case study (toy logging)

Take a logging function as an example, that behaves like `console.log` in general, but has also some fancy additional features, like timestamping and indentation. As the proof of concept, one may come up with the following code (omiting the screen output part):

```javascript
indent = 0                                          // Configuration
timestamp = false

log = (...args) =>                                  // Implementation

        (timestamp ? [new Date (), ...args] : args) // Insert timestamp (if needed)
        .map (arg => String (arg))                  // Stringify arguments 
        .join (' ')                                 // Concatenate results
        .split ('\n')                               // Split with linebreaks
        .map (line => '\t'.repeat (indent) + line), // Apply indentation
        ...                                         // ...
```

It kinda "works", but these global configuration params are not looking good. One common way is to modify a function signature, introducing a special configuration parameter to it:

```javascript
log = ({ indent = 0, timestamp = false }, ...args) =>
```

But that's somewhat intrusive, invading the original call semantics. With closures and first-class functions, JS offers a better way of separating these concerns:

```javascript
configure = ({ indent = 0, timestamp = false }) =>   // Configuration
            (...args) =>                             // Implementation
            ...
```
```javascript
log = configure ({ indent: 2, timestamp: true })
log ('hello', 'world')
```

Some better languages even got this feature implemented on the syntatic level (currying)! But speaking of JS, it is also very convenient to have that `configure` as a regular method of a constructed function instance. This way you can stack up multiple `configure` calls, thus being able to incrementally update an existing configuration, in an _ad hoc_ way:

```javascript
mylog = log.configure ({ timestamp: true })

mylog ('hello')
mylog.configure ({ indent: 2 }) ('world') // ad-hoc configuration
```

I recently had coded a couple of tiny libraries ([as-table](https://github.com/xpl/as-table), [String.ify](https://github.com/xpl/string.ify)) embracing that API design principle, and found it immensely useful in practice.

But as of now, we had only scratched the surface of the hidden complexity landscape that _Pipez_ successfully tackles. When you start thinking about _configuration_ — i.e. what and how can be parameterized externally — once-simple things can quickly start getting really complicated...

```javascript
log = ({

        indentLevel      = 0,
        indentCharacters = '\t'                          // Many prefer spaces over tabs
        timestamp        = false,
        stringify        = x => String (x)               // Custom argument stringifiers are more than useful
        stringifyDate    = date => date.toISOString (),  // So that are custom date formatters, too
        when             = new Date (),                  // Sometimes you need to set a date other than the current date
        linebreak        = '\n',                         // Think about outputting HTML (may want <br>'s instead)
        wordSeparator    = ' ',                          // In HTML we may want use the &nbsp; instead...
    
    }) => (...args) =>

        timestamp ? [stringifyDate (when), ...args] : args
        .map (arg => stringify (arg))
        .join (wordSeparator)
        .split (linebreak)
        .map (line => indentCharacters.repeat (indentLevel) + line),
        ...
```

And your beautiful tiny several-lines-of-code-proof-of-concept-thing start turning into 500-pound nightmare in production! The new ES6 destructuring/defaults syntax is amazing and helping alot, though.

Again, there exist better ways to deal with such a high degree extensibility. Can you, by the way, tell the biggest problem with the code above? To me, paradoxically, this is the very thing that we considered good until quite recently — the separation of concerns. The actual logic now is starting to split between the externalized and the intrinsic part, and it's becoming harder to grasp the full thing, as you need to constantly switch your attention back and forth while trying to understand what's the code does. As the codebase grows and you extract more features into configurable parameters, the problem arise.

This is not really better as the global parameters... Wouldn't it be nice, if we could somehow modularize the thing, finding a way of specifying the external parameters and their default values just along with the code that uses it?

## Function sequencing

Think of it as a sequence of functions. Each step is essentially a function, taking input from the previous step and outputting result to the next one in the chain:

```javascript
args → timestamp → stringify → concat → linebreaks → indent
```

Or (in terms of function application):

```javascript
indent (linebreaks (concat (stringify (timestamp (args)))))
```

As for somewhat unexpected feature, we can specify the sequence using the object initializer syntax, thus giving each step a meaningful name. Order matters, so it's really an ordered list, not a random dictonary — and with the new `Reflect.ownKeys` API we can consistently capture the order declared:

```javascript
log = pipez ({
    
    timestamp:  args  => ...,
    stringify:  args  => ...,
    concat:     args  => ...,
    linebreaks: text  => ...,
    indent:     lines => ...,
    ...
})

log ('hello', 'world')
```

Each routine can receive the externally configurable parameters (coming as the second formal parameter of a routine). These parameters are local, so no name conflicts with other steps' stuff — both routines can declare a `print` thing here, as an example:


```javascript
log = pipez ({
    
    timestamp: (args, { print = x => x.toISOString (), when = new Date () }) => [print (when), ...args],
    stringify: (args, { print = x => String (x) }) => args.map (print),
   
    ...
    
    indent: (lines, { level = 0, characters = '\t' }) => lines.map (line => characters.repeat (level) + line),
    
    ...
})
```

## Binding to parameters

These parameters can be bound via the `configure` calls.

### Pre-configuring

Given a `log` function, this creates a derived `mylog` function configured in some special way:

```javascript
mylog = log.configure ({ indent: { characters: '  ' }, timestamp: { print: x => x.getDate () } })
```

### Ad-hoc configuration

Given the previously defined `mylog` function, it prints `hello world` message with the indentation level set to `2`:

```javascript
mylog.configure ({ indent: { level: 2 } }) ('hello world')
```

## Turning arbitrary steps on and off

Instead of manually coding an on/off switch:

```javascript
log = pipez ({

    timestamp: (args, { yes = true, when = new Date () }) => yes ? [when, ...args] : args,
    ...
})
```

You can just use this semantics, as it's already recognized by the framework as built-in:

```javascript
mylog = log.configure ({ timestamp: { yes: false } })
```

A shortcut notation:

```javascript
mylog = log.configure ({ timestamp: false }) // timestamp step will be skipped from evaluation
```

## Replacing the code

You may override a step behavior completely, rather just changing it parameters. Pass a function instead of an object, and it will become a new step implementation. You can also declare and use the new external params as well.

Creates a derived `mylog` function that draws ANSI-colored timestamps in the end of messages (using the [ansicolor](https://github.com/xpl/ansicolor) library):

```javascript
mylog = log.configure ({ timestamp: (args, { color = 'red' }) => [...args, ansicolor[color] (new Date ())]
```

Prints 'hello world' followed with a cyan timestamp:

```javascript
mylog.configure ({ timestamp: { color: 'cyan' } }) ('hello world')
```

## Injecting code before and after steps

If you don't want to replace the original behavior, you may bind to the _before_ and the _after_ execution of steps, giving your function a special name, with `+` symbol placed before or after the target step name, respectively. Following code will be chained in just after the `concat` step:

```javascript
log.magenta = log.configure ({ 'concat+': text => ansicolor.magenta (text) })
```

And this schedules to execute just before the `linebreaks` step:

```javascript
log.magenta = log.configure ({ '+linebreaks': text => ansicolor.magenta (text) })
```

## Executing just a part of a sequence:

Executing all steps before a step (_not including_ it):

```javascript
let concatenated = log.before ('linebreaks') (...)
```

Executing all steps after a step, _including_ it:

```javascript
log.from ('linebreaks') (concatenated)
```

## Adding inherited methods

This adds `magenta` property accessor to the `log`:

```javascript
log = pipez ({ ... })

log.methods ({

    get magenta () { return this.configure ({ 'concat+': text => ansicolor.magenta (text) }) }
})

log.magenta ('this is magenta colored')
```

...and to it's every derived object:

```javascript
mylog = log.configure ({ ... })
mylog.magenta ('this is magenta colored too')
```

## Accessing initial arguments

Every step can access it from its configuration parameters, as the `initialArguments` property:

```javascript
const logThatReturnsFirstArgument = log.configure ({

    'output+': (_, { initialArguments: [first] }) => first // adds a step after the 'output' step
})

logThatReturnsFirstArgument ('foo', 'bar', 42) // returns 'foo'
```

## Applications

- [Ololog!](https://github.com/xpl/ololog) — a platform-agnostic logging with blackjack and hookers
