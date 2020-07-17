'use strict';

const fs = require('fs');
const request = require('request');
const assert = require('assert');
const Server = require('../../lib/server');

it( 'should parse HTTP body', done =>
{
    const server = new Server({ files: false }), webroot = 'http://localhost:8085';

    server.post( '/foo', async( req, res, next ) =>
    {
        //req.on( 'data', chunk => console.log( chunk.toString('utf8')) );

        //console.log( 'BODY', await req.body );

        //req.body.on( 'data', data => console.log( 'superdata', data ) )
        //req.body.on( 'file', file => file.skip() )
        //req.body.on( 'finish', data => console.log( 'finish' ) )

        //console.log( await req.body );

        res.reply( await req.body );

        //res.reply( 'true' );
    },
    { files: true, cors: 'ecommerce.webergency.com' });

    server.listen( 8085, async() =>
    {
        let data = { foo: ['foo','bar'], bar: 'foo' };

        request.post( webroot + '/foo', { form: data }, ( error, response, body ) =>
        {
            //console.log( body );

            assert.deepStrictEqual( JSON.parse( body ), data, 'Invalid body' );

            done();
        });

        //server.close( done );

        
    });
});
