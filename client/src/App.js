import React, { useState, useEffect, useRef } from "react";
import styles from './App.module.css';

const SOCKET_URL = "ws://localhost:4000";

function App() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [vote, setVote] = useState(null);
  const [voteCounts, setVoteCounts] = useState({ optionA: 0, optionB: 0 });
  const [joined, setJoined] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [ended, setEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  // Connect to WebSocket server
  useEffect(() => {
    socketRef.current = new WebSocket(SOCKET_URL);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    socketRef.current.onmessage = (message) => {
      const { type, payload } = JSON.parse(message.data);

      if (type === "room_created") {
        setRoomCode(payload.roomCode);
        setRoomCreated(true);
      }

      if (type === "joined_room") {
        setJoined(true);
      
       
        const storedVote = localStorage.getItem(`vote-${payload.roomCode}`);
        if (storedVote) {
          setVote(storedVote);
          setHasVoted(true);
        }
      
        
        const secondsPassed = Math.floor((Date.now() - payload.startTime) / 1000);
        const timeRemaining = Math.max(0, 60 - secondsPassed);
        setTimeLeft(timeRemaining);
      
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setEnded(true); 
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      if (type === "vote_update") {
        setVoteCounts(payload.voteCounts);
        setEnded(payload.ended);
      }

      if (type === "error") {
        alert(payload.message);
      }
    };

    return () => {
      socketRef.current.close();
    };
  }, []);

  // Handlers
  const handleCreateRoom = () => {
    socketRef.current.send(
      JSON.stringify({ type: "create_room", payload: {} })
    );
  };

  const handleJoinRoom = () => {
    socketRef.current.send(
      JSON.stringify({
        type: "join_room",
        payload: { roomCode, userName: name },
      })
    );
  };

  const handleVote = (option) => {
    if (hasVoted || ended) return;
    socketRef.current.send(
      JSON.stringify({
        type: "vote",
        payload: { roomCode, userName: name, option },
      })
    );
    setHasVoted(true);
    setVote(option);
    localStorage.setItem(`vote-${roomCode}`, option);
  };

  return (
    <div className={styles.body1  }>
    <div className={styles.maincontainer}>
      <h1>Live Poll Battle</h1>

      {!joined && (
        <>
          <input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)} required
          />
          <br />
          <input
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())} required
          />
          <br />

        <div className={styles.buttoncontainer}>
          <button onClick={handleCreateRoom}>Create Room</button>
          <button onClick={handleJoinRoom}>Join Room</button></div>
        </>
      )}

      {joined && (
        <div className={styles.result}>
        
        <div className={styles.topRight}>
          <h2>Room: {roomCode}</h2>
          <h2>Time left: {timeLeft}s</h2>
        </div>

          <h3>Hello {name}!</h3>
          <p className={styles.question}>Question: Cats vs Dogs</p>

          {ended ? (
           <p>Voting Window closed!</p>
          ) : hasVoted ? (
            <p>You voted: {vote.toUpperCase()}</p>
          ) : (
            <>
              <button className={styles.optionButton} onClick={() => handleVote("optionA")} disabled={ended}>Cats</button>
              <button className={styles.optionButton} onClick={() => handleVote("optionB")} disabled={ended}>Dogs</button>
            </>
          )}

          <div className={styles.result2}>
            <h4>Live Results</h4>
            <table>
              <tr>
                <th>Cats</th>
                <th>Dogs</th>
              </tr>
              <tr>
                <td>{voteCounts.optionA}</td>
                <td>{voteCounts.optionB}</td>
              </tr>
            </table>
          </div>
        </div>
      )}
    </div></div>
  );
}

export default App;
