'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const ReadWriteStream = require('stream').Duplex;
const assert = require('assert');
const Server = require('../../lib/server');

function REQ( method, url, data, options = {})
{
    return new Promise(( resolve, reject ) =>
    {
        let req = require( url.startsWith('https') ? 'https' : 'http' ).request( url, { method, ...options }, res =>
        {
            let body = [];

            //console.log( res.headers );

            if( res.headers.location )
            {
                url = url.replace(/^(http[s]?:\/\/[^\/]+).*$/, '$1' + res.headers.location );

                REQ( method, url, data, options = {}).then( resolve );
            }
            else
            {
                res.on( 'data', data => body.push( data ));
                res.on( 'end', () => resolve( Buffer.concat(body).toString('utf8')));
                res.on( 'error', reject );
            }
        });

        req.on( 'error', reject );

        data && req.write( data );
        req.end();
    });
}

it( 'should create HTTP Server', done =>
{
    let closedEvent = false;

    const server = new Server(), webroot = 'http://localhost:8080';

    server.on( 'close', () => closedEvent = true );
    server.on( 'close', () => closedEvent = true ); // test newListener

    server.use( '/bar', ( req, res, next ) =>
    {
        res.end( req.method + ' /bar' );
    });

    server.get( '/foo', ( req, res, next ) =>
    {
        res.end( 'GET /foo' );
    });

    server.put( '/foo', ( req, res, next ) =>
    {
        res.end( 'PUT /foo' );
    });

    server.post( '/foo', ( req, res, next ) =>
    {
        res.end( 'POST /foo' );
    });

    server.patch( '/foo', ( req, res, next ) =>
    {
        res.end( 'PATCH /foo' );
    });

    server.delete( '/foo', ( req, res, next ) =>
    {
        res.end( 'DELETE /foo' );
    });

    server.options( '/foo', ( req, res, next ) =>
    {
        res.end( 'OPTIONS /foo' );
    });

    server.get( '/text', ( req, res, next ) =>
    {
        res.reply( 'GET /text' );
    });

    server.get( '/buffer', ( req, res, next ) =>
    {
        res.reply( Buffer.from( 'GET /buffer', 'utf8' ));
    });

    server.get( '/buffer', ( req, res, next ) =>
    {
        res.reply( Buffer.from( 'GET /buffer', 'utf8' ));
    });

    server.get( '/json', ( req, res, next ) =>
    {
        res.reply({ method: 'GET', url: '/json' });
    });

    server.get( '/stream', ( req, res, next ) =>
    {
        let stream = new ReadWriteStream();

        res.reply( stream );
    });

    server.get( '/cookie', ( req, res, next ) =>
    {
        res.cookie( 'foo', 'bar', { maxAge: 1000, domain: 'localhost', path: '/', httpOnly: true, secure: true, sameSite: true, encode: encodeURIComponent });

        res.reply( 'GET /cookie' );
    });

    server.get( '/delete-cookie', ( req, res, next ) =>
    {
        res.cookie( 'foo', '' );

        res.reply( 'GET /delete-cookie' );
    });

    server.get( '/redirect', ( req, res, next ) =>
    {
        res.redirect( '/foo' );
    });

    server.listen( 8080, async() =>
    {
        let server2 = new Server();

        server2.on( 'error', () => {});

        server2.listen( 8080 );

        for( let i = 0; i < 10; ++i )
        {
            assert.equal( await REQ( 'GET', webroot + '/foo' ), 'GET /foo', 'Invalid response' );
            assert.equal( await REQ( 'PUT', webroot + '/foo' ), 'PUT /foo', 'Invalid response' );
            assert.equal( await REQ( 'POST', webroot + '/foo' ), 'POST /foo', 'Invalid response' );
            assert.equal( await REQ( 'PATCH', webroot + '/foo' ), 'PATCH /foo', 'Invalid response' );
            assert.equal( await REQ( 'DELETE', webroot + '/foo' ), 'DELETE /foo', 'Invalid response' );
            assert.equal( await REQ( 'OPTIONS', webroot + '/foo' ), 'OPTIONS /foo', 'Invalid response' );
            
            assert.equal( await REQ( 'GET', webroot + '/bar' ), 'GET /bar', 'Invalid response' );
            assert.equal( await REQ( 'PUT', webroot + '/bar' ), 'PUT /bar', 'Invalid response' );
            assert.equal( await REQ( 'POST', webroot + '/bar' ), 'POST /bar', 'Invalid response' );
            assert.equal( await REQ( 'PATCH', webroot + '/bar' ), 'PATCH /bar', 'Invalid response' );
            assert.equal( await REQ( 'DELETE', webroot + '/bar' ), 'DELETE /bar', 'Invalid response' );
            assert.equal( await REQ( 'OPTIONS', webroot + '/bar' ), 'OPTIONS /bar', 'Invalid response' );

            assert.equal( await REQ( 'GET', webroot + '/text' ), 'GET /text', 'Invalid response' );
            assert.equal( await REQ( 'GET', webroot + '/buffer' ), 'GET /buffer', 'Invalid response' );
            assert.equal( await REQ( 'GET', webroot + '/json' ), '{"method":"GET","url":"/json"}', 'Invalid response' );
            //assert.equal( await REQ( 'GET', webroot + '/stream' ), 'GET /stream', 'Invalid response' );

            assert.equal( await REQ( 'GET', webroot + '/cookie' ), 'GET /cookie', 'Invalid response' );
            assert.equal( await REQ( 'GET', webroot + '/redirect' ), 'GET /foo', 'Invalid response' );
        }

        server.close(() =>
        {
            assert.ok( closedEvent, 'didn`t emit close event' );

            done();
        });
    });
});

it( 'should create HTTPS Server', done =>
{
    let closedEvent = false;

    const server = new Server(
    {
        tls :
        {
            ca  : fs.readFileSync( __dirname + '/../config/localhost.crt' ),
            cert: fs.readFileSync( __dirname + '/../config/localhost.crt' ),
            key : fs.readFileSync( __dirname + '/../config/localhost.key' )
        }
    }),
    webroot = 'https://localhost:8081';

    server.on( 'close', () => closedEvent = true );
    server.on( 'close', () => closedEvent = true ); // test newListener

    server.use( '/bar', ( req, res, next ) =>
    {
        res.end( req.method + ' /bar' );
    });

    server.get( '/foo', ( req, res, next ) =>
    {
        res.end( 'GET /foo' );
    });

    server.put( '/foo', ( req, res, next ) =>
    {
        res.end( 'PUT /foo' );
    });

    server.post( '/foo', ( req, res, next ) =>
    {
        res.end( 'POST /foo' );
    });

    server.patch( '/foo', ( req, res, next ) =>
    {
        res.end( 'PATCH /foo' );
    });

    server.delete( '/foo', ( req, res, next ) =>
    {
        res.end( 'DELETE /foo' );
    });

    server.options( '/foo', ( req, res, next ) =>
    {
        res.end( 'OPTIONS /foo' );
    });

    server.listen( 8081, async() =>
    {
        for( let i = 0; i < 10; ++i )
        {
            assert.equal( await REQ( 'GET', webroot + '/foo' ), 'GET /foo', 'Invalid response' );
            assert.equal( await REQ( 'PUT', webroot + '/foo' ), 'PUT /foo', 'Invalid response' );
            assert.equal( await REQ( 'POST', webroot + '/foo' ), 'POST /foo', 'Invalid response' );
            assert.equal( await REQ( 'PATCH', webroot + '/foo' ), 'PATCH /foo', 'Invalid response' );
            assert.equal( await REQ( 'DELETE', webroot + '/foo' ), 'DELETE /foo', 'Invalid response' );
            assert.equal( await REQ( 'OPTIONS', webroot + '/foo' ), 'OPTIONS /foo', 'Invalid response' );
            
            assert.equal( await REQ( 'GET', webroot + '/bar' ), 'GET /bar', 'Invalid response' );
            assert.equal( await REQ( 'PUT', webroot + '/bar' ), 'PUT /bar', 'Invalid response' );
            assert.equal( await REQ( 'POST', webroot + '/bar' ), 'POST /bar', 'Invalid response' );
            assert.equal( await REQ( 'PATCH', webroot + '/bar' ), 'PATCH /bar', 'Invalid response' );
            assert.equal( await REQ( 'DELETE', webroot + '/bar' ), 'DELETE /bar', 'Invalid response' );
            assert.equal( await REQ( 'OPTIONS', webroot + '/bar' ), 'OPTIONS /bar', 'Invalid response' );
        }

        server.close(() =>
        {
            assert.ok( closedEvent, 'didn`t emit close event' );

            done();
        });
    });
});