'use strict'
const server = require('http').createServer();
const io = require('socket.io')(server,{ 
  cors: { origin: '*' }
});

// keep track of all components that client sends
let xmlString = '';
/**
 * List all connections
 * @type {string: SocketIO.Socket}
 */
const sockets = {};
// Socket Server
io.on('connection', (socket) => {
  console.log('Socket new Connection');
  // Save the list of all connections to a variable
  sockets[socket.io] = socket;

  
//console.log('sockets son ',sockets);
// Send events to all active connections
Object.values(sockets).forEach((socket)=>{
   
   //console.log('xmlString is... ',xmlString);
   socket.emit('draw_component', {xml: xmlString});
});


  
  socket.on('welcome',()=>{
    console.log('un usuario saluda');
  });

  socket.on('draw_component', data => {
    //console.log('server socketlisten draw_component...');
    //console.log('component is ...', data);
    xmlString = data.xml;
    io.sockets.emit('draw_component', data );
  });
  
  
  // When disconnect, delete the socket with the variable
  socket.on('disconnect', () => {
    console.log('Socket Disconnection');
    delete sockets[socket.id]
  })

})

//process.env.PORT ||9090
server.listen( 9090);
console.log('servidor socket conectado en el puerto 9090');
module.exports = {
  sockets,
  server,
  io
}