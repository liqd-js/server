'use strict';

const EventEmitter = require('events');
const Options = require('@liqd-js/options');
const Router = require('./router');
const Request = require('./request');
const Response = require('./response');

module.exports = class Server extends EventEmitter
{
    static get Router(){ return Router }

    #server; #ws_server; #options; #router = new Router();

    constructor( options = {})
    {
        super();

        this.#options = Options( options,
        {
            tls         : { _required: false, _type: 'object' },
            websocket	: { _required: false, _type: 'object' },
            port	    : { _required: false, _type: 'number' },
        });

        this.#server = require( this.#options.tls ? 'https' : 'http' ).createServer( this.#options.tls || undefined );

        this.#server.on( 'request', ( request, response ) =>
		{
            this.#router.dispatch( Request( request ), Response( response ));
        });
        
        this.#server.on( 'error', error => this.emit( 'error', error ));

        this.on( 'newListener', event =>
        {
            if( this.listenerCount( event ) === 0 )
            {
                this.#server.on( event, ( ...args ) => this.emit( event, ...args ));
            }
        });

        if( this.#options.port )
        {
            this.listen( this.#options.port );
        }
    }

    use(     ...args ){ this.#router.use(            ...args ); return this }
    get(     ...args ){ this.#router.use( 'GET',     ...args ); return this }
    put(     ...args ){ this.#router.use( 'PUT',     ...args ); return this }
    post(    ...args ){ this.#router.use( 'POST',    ...args ); return this }
    patch(   ...args ){ this.#router.use( 'PATCH',   ...args ); return this }
    delete(  ...args ){ this.#router.use( 'DELETE',  ...args ); return this }
    options( ...args ){ this.#router.use( 'OPTIONS', ...args ); return this }
    
    error( ...args ){ this.#router.error( ...args ); return this }

    listen( port, callback )
    {
        this.#server.listen( port, callback ); return this;
    }

    close( callback )
    {
        this.#server.close(() => 
        {
            this.#server.removeAllListeners();
            this.removeAllListeners();

            callback && callback();
        });
    }
}