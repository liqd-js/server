'use strict';

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

const Router = module.exports = class Router
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

    use( ...args )
    {
        let methods = [], paths = [], handlers = [], options = {};

        for( let arg of args.flat() )
        {
            if(  isMethod( arg )){  methods.push( arg )} else
            if(    isPath( arg )){    paths.push( arg )} else
            if( isHandler( arg )){ handlers.push( arg )} else
            /*if( isOptions( arg )*/{ options = arg }
        }

        if( handlers.length )
        {
            this.#routes.push({ methods, paths: paths.map( p => Router.compilePath( p )), handlers, options });
        }
    }

    dispatch( request, response, routeNo = 0, handlerNo = 0, skipHandlers = false )
    {
        let route = this.#routes[ routeNo ];

        const handleRequest = () =>
        {
            route.handlers[ handlerNo ]( request, response, route => 
            {
                this.dispatch( request, response, routeNo, ++handlerNo, route === 'route' );
            });
        }

        if( handlerNo )
        {
            if( !skipHandlers && handlerNo < this.#routes[ routeNo ].handlers.length )
            {
                return handleRequest();
            }

            ++routeNo; handlerNo = 0;
        }

        for( ; routeNo < this.#routes.length; ++routeNo )
        {
            route = this.#routes[ routeNo ];

            if( route.methods.length === 0 || route.methods.includes( request.method ))
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

        // TODO custom 404
    }
}