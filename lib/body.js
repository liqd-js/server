'use strict';

const { Readable } = require('stream').Readable;
const HttpBodyParser = require('@liqd-js/http-body-parser');

const nativePromiseExecutorRE = /^function[\sA-Za-z0-9]*\(\s*\)\s*{\s*\[\s*native\s+code\s*\]\s*}\s*$/;

function isNativePromiseExecutor( executor )
{
  return nativePromiseExecutorRE.test( executor.toString() );
}

module.exports = class Body extends Promise
{
    #body_parser;

    constructor( executor )
    {
        let body_parser, request;

        if( executor instanceof Readable )
        {
            request = executor;
            body_parser = new HttpBodyParser( request.headers );

            executor = ( resolve, reject ) =>
            {
                body_parser.on( 'data', resolve );
                body_parser.on( 'error', reject );
            }
        }

        super(( resolve, reject ) =>
        {
            if( isNativePromiseExecutor( executor ))
            {
                executor( resolve, reject );
            }
            else if( executor instanceof Promise )
            {
                executor.then( resolve, reject );
            }
            else
            {
                process.nextTick(() => executor( resolve, reject ));
            }
        });

        if( body_parser )
        {
            this.#body_parser = body_parser;
            request.pipe( this.#body_parser );
        }
    }

    on( event, handler )
    {
        this.#body_parser.on( event, handler );

        return this;
    }
}