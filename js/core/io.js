'use strict'

const server = require('http').createServer();
const io = require('socket.io')(server,{ 
  cors: { origin: '*' }
});

// keep track of all components that client sends
// List all Rooms Graphs
let roomGraphXmls = {};

/**
 * List all connections
 * @type {string: SocketIO.Socket}
 */
const sockets = {};

const users = [];



const addUser = (id, name, room) => {
    const existingUser = users.find(user => user.name.trim().toLowerCase() === name.trim().toLowerCase())
    if (!name && !room) return { error: "Username and room are required" }
    if (!name) return { error: "Username is required" }
    if (!room) return { error: "Room is required" }

    const user = { id, name, room }
    if (!existingUser) users.push(user);
    return { user }
}


const findRoom = (room) =>{
  let ok = false;
  Object.keys(roomGraphXmls).forEach((room_id) => {
    if(room_id == room){
      ok = true;
      return;
    }  
  });
  return ok;

}

// Socket Server
io.on('connection', (socket) => {
  
    console.log('socket new connection... '+socket.id);

  socket.on('login', ({ name, room }) => {
    console.log('connect to login');
    const { user, error } = addUser(socket.id, name, room);
    console.log(user);
    console.log(error);
    if(!error){
      let xmlString  = '';
      console.log('roomGraphXml is .... ');
      console.log(roomGraphXmls);
      console.log(findRoom(room));
      if(findRoom(room)){
        xmlString = roomGraphXmls[room]
      } else {
        roomGraphXmls[room] = xmlString;
      }
      // join to room
      socket.join(user.room);
      // load draw_components 
      socket.emit('draw_component', {xml: xmlString});
    }
    
    
  });

  // Save the list of all connections to a variable
  sockets[socket.id] =  socket;

  socket.on('draw_component', (data) => {
    if(data.room){
      roomGraphXmls[data.room] = data.xml;
    }
    
    //io.sockets.emit('draw_component', data );
    socket.in(data.room).emit('draw_component', data );
  });
  
  
  // When disconnect, delete the socket with the variable
  socket.on('disconnect', () => {
    console.log('Socket Disconnection');
    delete sockets[socket.id];
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