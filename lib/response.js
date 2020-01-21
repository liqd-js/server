'use strict';

function bindFunction( object, property, func )
{
    Object.defineProperty( object, property,
    {
        configurable    : true,
        enumerable      : false,
        get             : func
    });
}

module.exports = function Response( response )
{
    /*bindFunction( response, 'path', function(  )
    {

    });

    bindFunction( response, 'path', function(  )
    {

    });

    bindFunction( response, 'path', function(  )
    {

    });*/
    
    return response;
}