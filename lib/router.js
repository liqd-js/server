'use strict';

// TODO zistit preco nejde '/avatars/:id/:size([0-9]*x[0-9]*).jpg'

const HTTP_METHODS = new Set([ 'HEAD', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE' ]);
const PATH_REPEAT_RE = /(?<!\))\*/g;
const PATH_DOT_RE = /\./g;
const PATH_PARAM_WH_DEF_RE = /:([a-zA-Z_]+)\((([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(\))+\))+\))+\))+\))+\))+\))+\))+)\)/g; // ([^(]|\\((?R)\\))+
const PATH_PARAM_WO_DEF_RE = /:([a-zA-Z_]+)/g;

//const Arr = ( arr ) => Array.isArray( arr ) ? arr : [ arr ];
const isMethod = ( method ) => ( typeof method === 'string' && HTTP_METHODS.has( method ));
const isPath = ( path ) => ( path instanceof RegExp ) || ( typeof path === 'string' /* && !isMethod( path )*/ );
const isHandler = ( handler ) => typeof handler === 'function';
//const isOptions = ( options ) => typeof options === 'object' /* && !( options instanceof RegExp )*/;

module.exports = class Router
{
    static compilePath( path )
    {
        if( !( path instanceof RegExp ))
        {
            path = new RegExp
            (   '^' + 
                path
                    .replace( PATH_DOT_RE,          '\\.' )
                    .replace( PATH_REPEAT_RE,       '.*' )
                    .replace( PATH_PARAM_WH_DEF_RE, '(?<$1>$2)' )
                    .replace( PATH_PARAM_WO_DEF_RE, '(?<$1>[^\\/]+)' )
                + '$',
                '' 
            );
        }

        return path;
    }

    #routes = [];

    constructor()
    {
        
    }

    #parse( ...args )
    {
        let methods = [], paths = [], handlers = [], options = {};

        for( let arg of args.flat() )
        {
            if(  isMethod( arg )){  methods.push( arg )} else
            if(    isPath( arg )){    paths.push( Router.compilePath( arg ))} else
            if( isHandler( arg )){ handlers.push( arg )} else
            /*if( isOptions( arg )*/{ options = arg }
        }

        return { methods, paths, handlers, options };
    }

    use( ...args )
    {
        args = this.#parse( ...args );

        if( args.handlers.length )
        {
            this.#routes.push( args );
        }
    }

    ws(  ...args )
    {
        args = this.#parse( ...args );

        if( args.handlers.length )
        {
            args.handlers = args.handlers.map( h => ( req, res, next ) => h( res, req, next ));

            this.#routes.push( args );
        }
    }

    error( ...args )
    {
        args = this.#parse( ...args );

        if( args.handlers.length )
        {
            this.#routes.push({ ...args, type: 'error' });
        }
    }

    dispatch( request, response, routeNo = 0, handlerNo = 0, skipHandlers = false, error = undefined )
    {
        let route = this.#routes[ routeNo ];

        const handleRequest = async() =>
        {
            try
            {
                if( error )
                {
                    await route.handlers[ handlerNo ]( error, request, response );
                }
                else
                {
                    await route.handlers[ handlerNo ]( request, response, route => 
                    {
                        this.dispatch( request, response, routeNo, ++handlerNo, route === 'route' );
                    });
                }
            }
            catch( err )
            {
                this.dispatch( request, response, routeNo, ++handlerNo, false, err );
            }
        }

        if( handlerNo )
        {
            if( !skipHandlers )
            {
                for( ; handlerNo < this.#routes[ routeNo ].handlers.length; ++handlerNo )
                {
                    if(( error && this.#routes[ routeNo ].type === 'error' ) || ( !error && route.type !== 'error' ))
                    {
                        return handleRequest();
                    }
                }
            }

            ++routeNo; handlerNo = 0;
        }

        for( ; routeNo < this.#routes.length; ++routeNo )
        {
            route = this.#routes[ routeNo ];

            if(( error && route.type === 'error' ) || ( !error && route.type !== 'error' && ( route.methods.length === 0 || route.methods.includes( request.method ))))
            {
                if( route.paths.length === 0 )
                {
                    request.params = {};

                    return handleRequest();
                }
                else
                {
                    for( let pathNo = 0; pathNo < route.paths.length; ++pathNo )
                    {
                        let path = route.paths[ pathNo ].exec( request.path );

                        if( path )
                        {
                            request.params = path.groups || {};

                            return handleRequest();
                        }
                    }
                }
            }
        }
        
        if( !response.reply )
        {
            response.close();
        }
        else if( error )
        {
            response.reply( 500, 'Internal server error' );
        }
        else
        {
            // TODO custom 404
            response.reply( 404, 'Not found' );
        }
    }

    handles( request )
    {
        return true; // TODO
    }
}