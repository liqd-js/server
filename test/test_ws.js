const Server = require('../lib/server');
const { Client } = require('@liqd-js/websocket');

const server = new Server({ port: 8080 });

server.ws( '/client', ( client, req, next ) =>
{
    console.log( 'Client connected' );

    setInterval(() => client.send( 'Foo' ), 1000 );

    client.on( 'message', message => console.log( 'Client Message', message ));
});

const client = new Client( 'ws://localhost:8080/client' );

client.on( 'open', () =>
{
    console.log( 'Client connected' );

    client.on( 'message', message => console.log( 'Message', message ));

    setInterval(() => client.send( 'Bar' ), 1000 );
});