const express = require('express');
const { Server } = require('ws');
const http = require('http');

const app = express();
const port = 3000;

app.use(express.static('public'));

const server = http.createServer(app);
const wss = new Server({ server });

// Array to hold connected users
let connectedUsers = [];

// Function to broadcast the connected users list to all clients
function broadcastUserList() {
  const userList = connectedUsers.map(user => ({
    userId: user.userId,
    username: user.username,
  }));

  connectedUsers.forEach(user => {
    if (user.socket.readyState === user.socket.OPEN) {
      user.socket.send(JSON.stringify({ type: 'userList', userList }));
    }
  });
}

wss.on('connection', (socket) => {
  console.log('Client connected');

  // Listen for messages from the client
  socket.on('message', (data) => {
    const parsedData = JSON.parse(data);

    // Register a user with their userId and username
    if (parsedData.type === 'register') {
      const { userId, username } = parsedData;
      connectedUsers.push({ userId, username, socket });
      console.log(`User ${username} connected`);
      broadcastUserList(); // Broadcast the updated user list
    }

    // Handle sending messages to a specific user
    if (parsedData.type === 'message') {
      const { userId, message } = parsedData;
      const targetUser = connectedUsers.find(user => user.userId === userId);
      if (targetUser && targetUser.socket.readyState === targetUser.socket.OPEN) {
        targetUser.socket.send(JSON.stringify({ type: 'message', message }));
      }
    }
  });

  // Handle client disconnection
  socket.on('close', () => {
    connectedUsers = connectedUsers.filter(user => user.socket !== socket);
    console.log('Client disconnected');
    broadcastUserList(); // Broadcast the updated user list when someone disconnects
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
