const assert = require ('assert')
    , bullet = require ('./string.bullet')

describe ('string.bullet', () => {

    it ('works', () => {

        assert.equal     (bullet ('\t\u001b[101m• \u001b[49m', 'foo\nbar\nbaz'),        '\t\u001b[101m• \u001b[49mfoo\n\t  bar\n\t  baz')
        assert.deepEqual (bullet ('\t\u001b[101m• \u001b[49m', ['foo', 'bar', 'baz']), ['\t\u001b[101m• \u001b[49mfoo', '\t  bar', '\t  baz'])
    })
})