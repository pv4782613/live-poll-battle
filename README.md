Live Poll Battle is a real-time web application where users can join a room and cast votes on a poll within a 60-second time window. 
Votes are updated live for all participants.

**Features Implemented**
- Create or join a voting room via a unique room code
- Real-time vote updates using WebSockets
- One vote per user (with local storage persistence)
- 60-second countdown timer per poll
- Voting automatically disables after the timer ends
- Live results display in a table format

**Setup Instructions**
<ol>
  <li>Clone the repository</li><br>
  git clone https://github.com/yourusername/live-poll-battle.git<br>
  cd live-poll-battle<br>
  <li>Start the backend (Node.js WebSocket server)</li><br>
  cd server<br>
  npm install<br>
  node server.js<br>
<li>Start the frontend (React app)</li><br>
  cd client<br>
  npm install<br>
  npm start<br>
</ol>
    
**Architecture**
<ul><li>Each room is uniquely identified by a randomly generated room code.</li>
<li>When a user joins a room, the server tracks them by their name and room code.</li>
<li>A poll starts when the first participant joins, initializing a shared startTime.</li>
<li>All vote data is stored in-memory on the server using a central rooms object.</li>
<li>WebSocket connections are used for sending and receiving:
    Room creation and join events
    Vote submission
    Real-time vote result updates
    Countdown timer management (via startTime sync)</li>
<li>The frontend uses useEffect to sync the countdown and updates state in real time</li><ul>
