import React, { useEffect, useState } from 'react';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    // Fetch the stored username from localStorage
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');
    
    if (!storedUsername || !storedUserId) {
      // If no username or userId exists, ask the user to provide it
      const id = prompt('Enter your userId:');
      const name = prompt('Enter your username:');
      
      setUserId(id);
      setUsername(name);
      
      // Store the username and userId in localStorage for session-like persistence
      localStorage.setItem('username', name);
      localStorage.setItem('userId', id);
    } else {
      // If already stored, use it directly
      setUsername(storedUsername);
      setUserId(storedUserId);
    }

    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:3000');
    setSocket(ws);

    // Register the userId and username once the connection is established
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', userId: storedUserId || userId, username: storedUsername || username }));
    };

    // Listen for messages from the server
    ws.onmessage = (event) => {
      const messageData = JSON.parse(event.data);

      // Handle incoming messages
      if (messageData.type === 'message') {
        alert(`Received message: ${messageData.message}`);
      }

      // Update the list of connected users
      if (messageData.type === 'userList') {
        setUserList(messageData.userList);
      }
    };

    return () => ws.close();
  }, [username, userId]);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN && targetUserId) {
      socket.send(JSON.stringify({
        type: 'message',
        userId: targetUserId,
        message: input,
      }));
      setInput('');
    }
  };

  return (
    <div>
      <h1>Welcome, {username}</h1>
      <div>
        <h2>Send a message</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter message"
        />
        <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
          <option value="">Select a user to send message to</option>
          {userList
            .filter(user => user.userId !== userId) // Don't show the current user in the list
            .map(user => (
              <option key={user.userId} value={user.userId}>
                {user.username} ({user.userId})
              </option>
          ))}
        </select>
        <button onClick={sendMessage}>Send Message</button>
      </div>
      <div>
        <h2>Connected Users:</h2>
        <ul>
          {userList.map(user => (
            <li key={user.userId}>
              {user.username} ({user.userId})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
