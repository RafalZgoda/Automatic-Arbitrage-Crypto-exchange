"use strict";

/*  ------------------------------------------------------------------------ */

const assert = (...args) => require ('assert')[(args.find (x => typeof x === 'object')) ? 'deepEqual' : 'equal'] (...args)

/*  ------------------------------------------------------------------------ */

describe ('pipez', () => {
    
    let pipez = require (process.env.PIPEZ_TEST_FILE)
    let log, notime

    it ('Defining a pipeline', () => {

        log = pipez ({
            
            stringify:  (args, { print = x => String (x) }) => args.map (print),
            concat:     (args, { separator = ' ' }) => args.join (separator),
            linebreaks: (text, { newline = '\n' })  => text.split (newline),
            timestamp:  (lines, {
                            date = new Date ('2017-02-27T12:45:19.951Z'), // new Date (),
                            print = date => date.toISOString () + ' '
                        }) => {
                            const stamp = print (date)
                            return lines.map ((line, i) => ((i === 0) ? stamp : ' '.repeat (stamp.length)) + line)
                        },

            output: lines => lines.join ('\n')
        })

        assert (true, log instanceof Function)
        assert ('2017-02-27T12:45:19.951Z foo [object Object] qux', log ('foo', { bar: 42 }, 'qux'))
    })

    it ('Parameterization', () => {

        log = log.configure ({
                        concat: { separator: ', ' },
                        stringify: { print: x => (typeof x === 'string') ? x : JSON.stringify (x) },
                        timestamp: {
                            date: new Date ('2017-04-27T12:45:19.951Z'),
                            print: d => '[' + [d.getDate (), d.getMonth (), d.getFullYear ()].join ('.') + '] '
                        }
                    })

        assert ('[27.3.2017] foo, {"bar":42}, qux', log ('foo', { bar: 42 }, 'qux'))
    })

    it ('overriding a step function', () => {

        assert ('bar\nfoo', log.configure ({ timestamp: false, output: lines => lines.reverse ().join ('\n') }) ('foo\nbar'))
    })

    it ('Before/after', () => {

        const italic = log.configure ({ '+linebreaks': s => '<i>' + s + '</i>' }) // before linebreaks
        const bold   = log.configure ({ 'concat+':     s => '<b>' + s + '</b>' }) // after concat

        assert ('[27.3.2017] <i>ololo</i>', italic ('ololo'))
        assert ('[27.3.2017] <b>ololo</b>', bold   ('ololo'))
    })

    it ('Optional steps', () => {

        assert ('hello, world', log.configure ({ timestamp:        false })   ('hello', 'world'))
        assert ('hello, world', log.configure ({ timestamp: { yes: false } }) ('hello', 'world'))

        assert ('[27.3.2017] hello, world', log.configure ({ timestamp: false })
                                               .configure ({ timestamp: true }) ('hello', 'world')) // re-enabling works

    })

    it ('Adding methods', () => {

        log.methods ({

            get bold () { return this.configure ({ 'concat+': s => '<b>' + s + '</b>' }) }
        })

        assert ('[27.3.2017] <b>ololo</b>', log.bold ('ololo'))
    })

    it ('Methods inheritance', () => {

        notime = log.configure ({ timestamp: false })

        assert ('<b>ololo</b>', notime.bold ('ololo'))
    })

    it ("Calling methods() on derived objects shouldn't change the original one", () => {

        notime.methods ({

            get italic () { return this.configure ({ 'concat+': s => '<i>' + s + '</i>' }) }
        })

        assert ('<i>ololo</i>', notime.italic ('ololo'))
        assert (undefined, log.italic)
    })

    it ('Accessing the call chain impl', () => {

        assert (['foo', 'bar'], log.impl.linebreaks ('foo\nbar'))
    })

    it ('.before / .from', () => {

        const concatenated = log.before ('linebreaks') ({ foo: 42 }, 'bar\nqux')
        const final        = log.from ('linebreaks') (concatenated)

        assert ('{"foo":42}, bar\nqux', concatenated)
        assert ('[27.3.2017] {"foo":42}, bar\n            qux', final)
    })

    it ('.prev + this', () => {
 
        // TODO
    })

    it ('initialArguments', () => {

        const logThatReturnsFirstArgument = log.configure ({

            'output+': (_, { initialArguments }) => initialArguments[0]
        })

        assert (logThatReturnsFirstArgument ('foo', 'bar', 42), 'foo')
    })

    it ('configure () with no arguments', () => {

        assert (log.configure () ('foo'), '[27.3.2017] foo')
    })
})

