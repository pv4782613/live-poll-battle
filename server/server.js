const http=require("http");
const express=require("express");
const cors=require("cors");
const WebSocket=require("ws");


const app=express();
app.use(cors());

const server=http.createServer(app);

const wss=new WebSocket.Server({server})
const rooms = {}; 

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase(); 
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { type, payload } = data;

    if (type === 'create_room') {
      const roomCode = generateRoomCode();
      rooms[roomCode] = {
        users: [],
        votes: {},
        startTime: Date.now(),
        ended: false
      };
      ws.send(JSON.stringify({ type: 'room_created', payload: { roomCode } }));
    }

    if (type === 'join_room') {
      const { roomCode, userName } = payload;
      const room = rooms[roomCode];

      if (!room) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: "Please Enter valid Room number" } }));
        return;
      }

      if (!userName || userName.trim() === "") {
        ws.send(JSON.stringify({ type: 'error', payload: { message: "Username cannot be empty." } }));
        return;
      }

      if (room.ended) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: "Voting has ended for this room." } }));
        return;
      }

     
      const nameTaken = room.users.some(u => u.userName === userName);
      if (nameTaken) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: "Username already taken in this room." } }));
        return;
      }

        room.users.push({ ws, userName });
        ws.roomCode = roomCode;
        ws.userName = userName;

        ws.send(JSON.stringify({ 
            type: 'joined_room', 
            payload: { roomCode, startTime: room.startTime } 
          }));

        broadcastVotes(roomCode);
      }
    

    if (type === 'vote') {
      const { roomCode, userName, option } = payload;
      const room = rooms[roomCode];
      if (room && !room.ended && !room.votes[userName]) {
        room.votes[userName] = option;
        broadcastVotes(roomCode);
      }
    }
  });
});

function broadcastVotes(roomCode) {
  const room = rooms[roomCode];
  const voteCounts = { optionA: 0, optionB: 0 };

  for (const vote of Object.values(room.votes)) {
    voteCounts[vote]++;
  }

  const timeElapsed = Date.now() - room.startTime;
  if (timeElapsed >= 60000) {
    room.ended = true;
  }
  const payload = {
    voteCounts,
    ended: room.ended,
    totalVotes: Object.keys(room.votes).length
  };

  room.users.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'vote_update', payload }));
    }
  });
}

server.listen(4000, () => console.log('WebSocket server running on port 4000'));
