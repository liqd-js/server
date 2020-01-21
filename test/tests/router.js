'use strict';

const assert = require('assert');
const Router = require('../../lib/router');

it( 'should compilePath - keep the RegExp', done =>
{
    let re = /\/test/;

    assert.ok( Router.compilePath( re ) === re, 'didn`t preserve RegExp' );

    done();
});

it( 'should compilePath - create RegExp', done =>
{
    const paths = 
    {
        '/foo' :
        {
            re      : '/^\\/foo$/',
            match   : [ '/foo' ],
            fail    : [ '/fooo', '/fo' ]
        },
        '/foo(/*)?' :
        {
            re      : '/^\\/foo(\\/.*)?$/',
            match   : [ '/foo', '/foo/bar', '/foo/' ],
            fail    : [ '/fooo', '/fo' ]
        },
        '/fo(ab)?o' :
        {
            re      : '/^\\/fo(ab)?o$/',
            match   : [ '/foo', '/foabo' ],
            fail    : [ '/fooo', '/foao', '/foababo','/foabo/' ]
        },
        '/fo(ab)*o' :
        {
            re      : '/^\\/fo(ab)*o$/',
            match   : [ '/foo', '/foabo', '/foababo' ],
            fail    : [ '/fooo', '/foao', '/foabo/' ]
        },
        '/fo(ab)+o' :
        {
            re      : '/^\\/fo(ab)+o$/',
            match   : [ '/foabo', '/foababo' ],
            fail    : [ '/foo', '/fooo', '/foao', '/foabo/' ]
        },
        '/fo(ab|cd)+o' :
        {
            re      : '/^\\/fo(ab|cd)+o$/',
            match   : [ '/foabo', '/foababo', '/focdo', '/focdcdo', '/foabcdo', '/focdabo' ],
            fail    : [ '/foo', '/fooo', '/foao', '/foabo/', '/focdo/' ]
        },
        '/:foo' :
        {
            re      : '/^\\/(?<foo>[^\\/]+)$/',
            match   : { '/foo' : { foo: 'foo' }, '/bar' : { foo: 'bar' } },
            fail    : [ '/foo/', '/foo/bar', '/bar/', '/bar/foo' ]
        },
        '/:foo(\\d+)' :
        {
            re      : '/^\\/(?<foo>\\d+)$/',
            match   : { '/123' : { foo: '123' }, '/1' : { foo: '1' } },
            fail    : [ '/foo', '/FOO', '/foo/', '/123/bar', '/bar/', '/bar/foo' ]
        },
        '/:foo([a-z]+)' :
        {
            re      : '/^\\/(?<foo>[a-z]+)$/',
            match   : { '/foo' : { foo: 'foo' }, '/bar' : { foo: 'bar' } },
            fail    : [ '/FOO', '/foo/', '/foo/bar', '/bar/', '/bar/foo' ]
        },
        '/:foo(ab|cd)' :
        {
            re      : '/^\\/(?<foo>ab|cd)$/',
            match   : { '/ab' : { foo: 'ab' }, '/cd' : { foo: 'cd' } },
            fail    : [ '/abc', '/foo/', '/ab/bar', '/bar/', '/cd/foo' ]
        },
        '/:foo(ab(a|b([a-z]+))cd)' :
        {
            re      : '/^\\/(?<foo>ab(a|b([a-z]+))cd)$/',
            match   : [],
            fail    : []
        },
        '/*.js' :
        {
            re      : '/^\\/.*\\.js$/',
            match   : [ '/foo.js' , '/foo/bar.js' ],
            fail    : [ '/foo.json' ]
        },
        '/*.(js|json)' :
        {
            re      : '/^\\/.*\\.(js|json)$/',
            match   : [ '/foo.js' , '/foo/bar.js', '/foo.json' , '/foo/bar.json' ],
            fail    : [ '/foo.css' ]
        },
        '/*.*' :
        {
            re      : '/^\\/.*\\..*$/',
            match   : [ '/foo.js' , '/foo/bar.js', '/foo.json' , '/foo/bar.json', '/foo.css' ],
            fail    : [ '/foo' ]
        }
    }

    for( let [ path, test ] of Object.entries( paths ))
    {
        let re = Router.compilePath( path );

        assert.equal( re.toString(), test.re, 'invalid regexp for path "' + path + '"' );

        if( Array.isArray( test.match ))
        {
            for( let test_path of test.match )
            {
                assert.ok( re.exec( test_path ), 'didn`t match valid path "' + test_path + '" for "' + path + '" : ' + test.re );
            }
        }
        else
        {
            for( let [ test_path, params ] of Object.entries( test.match ))
            {
                assert.ok( re.exec( test_path ), 'didn`t match valid path "' + test_path + '" for "' + path + '" : ' + test.re );
                assert.equal( JSON.stringify( re.exec( test_path ).groups ), JSON.stringify( params ), 'didn`t match path "' + test_path + '" parameters for "' + path + '" : ' + test.re );
            }
        }
        
        for( let test_path of test.fail )
        {
            assert.ok( !re.exec( test_path ), 'did match invalid path "' + test_path + '" for "' + path + '" : ' + test.re );
        }
    }

    done();
});

it( 'should bind routes', done =>
{
    const router = new Router();

    router.use([], []);
    router.use([ 'GET' ], [ '/foo' ]);
    router.use([ 'GET' ], [ '/foo' ], ( req, res, next ) => { res.write( '1' ); next() });
    router.use([ 'GET' ], [ '/foo' ], ( req, res, next ) => { res.write( '2' ); next() }, ( req, res, next ) => { res.write( '3' ); next() });
    router.use([ 'GET' ], [ '/foo' ], ( req, res, next ) => { res.write( '4' ); next() }, { foo: 'bar' });
    router.use([ 'GET' ], [ '/foo' ], ( req, res, next ) => { res.write( '5' ); next() }, ( req, res, next ) => { res.write( '6' ); next() }, { foo: 'bar' });
    router.use([ 'PUT' ], [ '/chain' ], ( req, res, next ) => { res.write( '7' ); next() }, ( req, res, next ) => { res.write( '8' ); next() }, { foo: 'bar' });
    router.use([ 'PUT' ], [ '/skip' ], ( req, res, next ) => { res.write( '9' ); next('route') }, ( req, res, next ) => { res.write( '10' ); next('route') }, { foo: 'bar' });
    router.use([ 'GET' ], [ '/param/:foo', '/param/:bar' ], ( req, res, next ) => { res.write( '11' + req.params.foo ); next() }, ( req, res, next ) => { res.write( '12' + req.params.foo ); next() });
    router.use([ 'GET' ], [ '/param/:foo/*' ], ( req, res, next ) => { res.write( '13' + req.params.foo ); next() }, ( req, res, next ) => { res.write( '14' + req.params.foo ); next() });
    router.use([ 'GET' ], [ '/param/bar(/*)?' ], ( req, res, next ) => { res.write( '15' + ( req.params.foo || '' )); next() }, ( req, res, next ) => { res.write( '16' + ( req.params.foo || '' )); next('route') });
    router.use([ 'GET' ], [ '/param/:foo', '/param/:foo/*' ], ( req, res, next ) => { res.write( '17' + req.params.foo ); next() });
    router.use([], [ '/patch' ], ( req, res, next ) => { res.write( '18' ); next() });
    router.use([], [], ( req, res, next ) => { res.end() });

    let requests = 0;

    class Response
    {
        constructor( response )
        {
            this.response = response;
            this.body = '';
            ++requests;
        }

        write( data )
        {
            this.body += data;
        }

        end( data )
        {
            assert.equal( this.body += data || '', this.response, 'Invalid response' );
            --requests;
        }
    }

    for( let i = 0; i < 10; ++i )
    {
        router.dispatch({ method: 'GET',    path: '/foo', params: {}}, new Response( '123456' ));
        router.dispatch({ method: 'PUT',    path: '/chain', params: {}}, new Response( '78' ));
        router.dispatch({ method: 'PUT',    path: '/skip', params: {}}, new Response( '9' ));
        router.dispatch({ method: 'GET',    path: '/param/bar', params: {}}, new Response( '11bar12bar151617bar' ));
        router.dispatch({ method: 'GET',    path: '/param/bar/foo', params: {}}, new Response( '13bar14bar151617bar' ));
        router.dispatch({ method: 'PATCH',  path: '/patch', params: {}}, new Response( '18' ));
    }
    
    if( requests > 0 ){ assert.fail( 'Not all requests dispatched' )}

    done();
});