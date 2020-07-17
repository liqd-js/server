'use strict';

const assert = require('assert');
const Request = require('../../lib/request');

it( 'should create Request', done =>
{
    const requests = 
    [
        [
            {
                url : '/foo',
                headers : {}
            },
            {
                url         : '/foo',
                path        : '/foo',
                params      : {},
                query       : {},
                cookies     : {},
                hostname    : undefined,
                xhr         : false
            },
        ],
        [
            {
                url : '/foo/bar?foo=bar',
                headers :
                {
                    'host'              : 'www.foo.bar',
                    'cookie'            : 'foo=bar',
                    'x-requested-with'  : 'Foo'
                }
            },
            {
                url         : '/foo/bar?foo=bar',
                path        : '/foo/bar',
                params      : {},
                query       : { foo: 'bar' },
                cookies     : { foo: 'bar' },
                hostname    : 'www.foo.bar',
                xhr         : false
            },
        ],
        [
            {
                url : '/bar/foo?foo=bar&bar=foobar',
                headers :
                {
                    'x-forwarded-host'  : 'www.bar.foo',
                    'host'              : 'www.foo.bar',
                    'cookie'            : 'foo=bar; bar=foo',
                    'x-requested-with'  : 'XMLHttpRequest'
                }
            },
            {
                url         : '/bar/foo?foo=bar&bar=foobar',
                path        : '/bar/foo',
                params      : {},
                query       : { foo: 'bar', bar: 'foobar' },
                cookies     : { foo: 'bar', bar: 'foo' },
                hostname    : 'www.bar.foo',
                xhr         : true
            },
        ]
    ]

    for( let request of requests )
    {
        let req = Request( request[0] );

        assert.deepStrictEqual(
        {
            url         : req.url,
            path        : req.path,
            params      : req.params,
            query       : req.query,
            cookies     : req.cookies,
            hostname    : req.hostname,
            xhr         : req.xhr
        },
        request[1], 'Invalid request' );
    }

    done();
});