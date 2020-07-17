'use strict';

const Querystring = require('@liqd-js/querystring');
const Body = require('./body');

function bindGetter( object, property )
{
    Object.defineProperty( object, property,
    {
        configurable    : true,
        enumerable      : true,
        get             : GETTERS[property]
    });
}

function cacheValue( object, property, value )
{
    Object.defineProperty( object, property,
    {
        configurable    : true,
        enumerable      : true,
        writable        : true,
        value
    });

    return value;
}

const GETTERS = 
{
    query : function()
    {
        return cacheValue( this, 'query', this.url.includes('?') ? Querystring.parse( this.url.replace( /^.*?\?/, '' )) : {});
    },
    cookies : function()
    {
        return cacheValue( this, 'cookies', Querystring.parseCookies( this.headers.cookie ));
    },
    hostname : function()
    {
        return cacheValue( this, 'hostname', this.headers['x-forwarded-host'] || this.headers['host'] );
    },
    xhr : function()
    {
        return cacheValue( this, 'xhr', ( this.headers['x-requested-with'] || '' ).toLowerCase() === 'xmlhttprequest' );
    }
}

module.exports = function Request( request )
{
    bindGetter( request, 'query' );
    bindGetter( request, 'cookies' );
    bindGetter( request, 'hostname' );
    bindGetter( request, 'xhr' );

    request.path    = request.url.replace( /\?.*$/, '' );
    request.params  = {};

    let body;

    Object.defineProperty( request, 'body',
    {
        configurable    : true,
        enumerable      : false,
        get : () =>
        {
            if( body === undefined )
            {
                body = new Body( request );
            }

            return body;
        },
        set : ( value ) =>
        {
            return body = value;
        }
    });
    
    return request;
}