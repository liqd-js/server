'use strict';

const Readable = require('stream').Readable;

function reply( code, data, type, callback )
{
    if( typeof code !== 'number' ){[ code, data, type, callback ] = [ 200, code, data, type ]}
    if( typeof type === 'function' ){[ type, callback ] = [ undefined, type ]}

    //TODO check if response type is not set
    //TODO support for data isStream

    if( data !== undefined && typeof data !== 'string' && !( data instanceof Buffer ) && !( data instanceof Readable ))
    {
        data = JSON.stringify( data );

        if( !type ){ type = 'application/json; charset=utf-8' }
    }

    if( !this.headersSent )
    {
        this.setHeader( 'Content-Type', type ? ( type.includes('charset') ? type : type + '; charset=utf-8' ) : 'text/plain; charset=utf-8' );
        this.writeHead( code );
    }

    if( data instanceof Readable )
    {
        data.pipe( this );

        if( callback ){ data.on( 'end', callback ); }
    }
    else
    {
        this.end( data, callback );
    }

    return this;
}

function render( ...args )
{
    return this.__options.renderer( this, ...args );
}

function redirect( code, location, callback = undefined )
{
    if( typeof code !== 'number' ){[ code, location, callback ] = [ 302, code, location ]}

    this.writeHead( code, { 'Location' : location });
    this.end( callback );

    return this;
}

function cookie( name, value, options = {})
{
    if( !value )
    {
        value = ''; options.expires = new Date(0);
    }

    this.setHeader( 'Set-Cookie', name + '=' + ( options.encode || encodeURIComponent )( value ) +
        ( options.maxAge 	? '; Max-Age=' + options.maxAge : '' ) +
        ( options.domain 	? '; Domain=' + options.domain : '' ) +
        ( options.path 		? '; Path=' + options.path : '' ) +
        ( options.expires 	? '; Expires=' + options.expires.toUTCString() : '' ) +
        ( options.httpOnly	? '; HttpOnly' : '' ) +
        ( options.secure 	? '; Secure' : '' ) +
        ( options.sameSite	? '; SameSite=' + ( options.sameSite === true ? 'Strict' : options.sameSite ) : '' )
    );

    return this;
}

function bindFunction( object, property, func )
{
    Object.defineProperty( object, property,
    {
        configurable    : true,
        enumerable      : false,
        writable        : false,
        value           : func
    });
}

module.exports = function Response( response, options )
{
    bindFunction( response, 'reply',    reply );
    bindFunction( response, 'render',   render );
    bindFunction( response, 'redirect', redirect );
    bindFunction( response, 'cookie',   cookie );

    Object.defineProperty( response, '__options', { value: options });
    
    return response;
}