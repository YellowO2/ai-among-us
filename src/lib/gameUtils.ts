import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
} from "firebase/firestore";
import { Room, Player, Question } from "../types/game";

// Generate a random 6-character room code
export const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a random alias for players
export const generateAlias = (): string => {
  const adjectives = [
    "Happy",
    "Sleepy",
    "Grumpy",
    "Sneezy",
    "Bashful",
    "Dopey",
    "Doc",
    "Clever",
    "Swift",
    "Brave",
    "Witty",
  ];
  const nouns = [
    "Turtle",
    "Dragon",
    "Wizard",
    "Knight",
    "Bunny",
    "Panda",
    "Fox",
    "Wolf",
    "Tiger",
    "Eagle",
    "Otter",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective}${noun}`;
};

// Create a new game room
export const createRoom = async (
  playerName: string,
  aiCount: number
): Promise<Room> => {
  const roomsRef = collection(db, "rooms");
  const roomCode = generateRoomCode();
  const roomId = `room_${Date.now()}`;

  const playerId = `player_${Date.now()}`;
  const player: Player = {
    id: playerId,
    name: playerName,
    alias: generateAlias(),
    isAI: false,
    isHost: true,
    answers: [],
    votes: [],
    votesReceived: 0,
    eliminated: false,
  };

  const room: Room = {
    id: roomId,
    code: roomCode,
    host: playerId,
    players: [player],
    status: "waiting",
    currentRound: 0,
    maxRounds: 0, // Will be calculated when game starts
    aiCount,
    roundStartTime: 0,
    answeringTime: 45, // Default 45 seconds for answering
    votingTime: 30, // Default 30 seconds for voting
  };

  await setDoc(doc(roomsRef, roomId), room);
  return room;
};

// Join an existing room
export const joinRoom = async (
  roomCode: string,
  playerName: string
): Promise<Room | null> => {
  const roomsRef = collection(db, "rooms");
  const q = query(roomsRef, where("code", "==", roomCode.toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const roomDoc = querySnapshot.docs[0];
  const room = roomDoc.data() as Room;

  // Check if the game has already started
  if (room.status !== "waiting") {
    return null;
  }

  const playerId = `player_${Date.now()}`;
  const player: Player = {
    id: playerId,
    name: playerName,
    alias: generateAlias(),
    isAI: false,
    isHost: false,
    answers: [],
    votes: [],
    votesReceived: 0,
    eliminated: false,
  };

  room.players.push(player);
  await updateDoc(doc(roomsRef, room.id), { players: room.players });
  return room;
};

// Start the game
export const startGame = async (roomId: string): Promise<Room | null> => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    return null;
  }

  const room = roomSnapshot.data() as Room;

  // Add AI players based on aiCount
  const currentPlayerCount = room.players.length;
  for (let i = 0; i < room.aiCount; i++) {
    const aiPlayer: Player = {
      id: `ai_${Date.now()}_${i}`,
      name: "AI Bot",
      alias: generateAlias(),
      isAI: true,
      isHost: false,
      answers: [],
      votes: [],
      votesReceived: 0,
      eliminated: false,
    };
    room.players.push(aiPlayer);
  }

  // Shuffle aliases to randomize identities
  const aliases = room.players.map((p) => p.alias);
  for (let i = aliases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [aliases[i], aliases[j]] = [aliases[j], aliases[i]];
  }

  // Assign shuffled aliases
  room.players.forEach((player, index) => {
    player.alias = aliases[index];
  });

  // Set max rounds based on player count (half the number of players)
  room.maxRounds = Math.floor((currentPlayerCount + room.aiCount) / 2);

  // Set game to answering state
  room.status = "answering";
  room.currentRound = 1;
  room.roundStartTime = Date.now();

  // Select first question
  room.currentQuestion = await getRandomQuestion();

  await updateDoc(roomRef, room);
  return room;
};

// Submit answer
export const submitAnswer = async (
  roomId: string,
  playerId: string,
  answer: string
): Promise<boolean> => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    return false;
  }

  const room = roomSnapshot.data() as Room;
  const playerIndex = room.players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1 || !room.currentQuestion) {
    return false;
  }

  const playerAnswer = {
    questionId: room.currentQuestion.id,
    content: answer,
    round: room.currentRound,
  };

  // Add answer to player's answers list
  room.players[playerIndex].answers.push(playerAnswer);

  // If AI player, generate answer automatically (will be implemented in a proper function)
  room.players
    .filter((p) => p.isAI && p.answers.length < room.currentRound)
    .forEach((ai) => {
      ai.answers.push({
        questionId: room.currentQuestion!.id,
        content: generateAIAnswer(room.currentQuestion!.text),
        round: room.currentRound,
      });
    });

  // Check if all players have answered
  const allAnswered = room.players.every(
    (p) => p.answers.some((a) => a.round === room.currentRound) || p.eliminated
  );

  // Move to voting phase if all players have answered or time is up
  if (allAnswered) {
    room.status = "voting";
    room.roundStartTime = Date.now();
  }

  await updateDoc(roomRef, room);
  return true;
};

// Submit vote
export const submitVote = async (
  roomId: string,
  playerId: string,
  votedForId: string,
  add: boolean // true to add vote, false to remove vote
): Promise<boolean> => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    return false;
  }

  const room = roomSnapshot.data() as Room;

  // Find the player and the player being voted for
  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  const votedForIndex = room.players.findIndex((p) => p.id === votedForId);

  if (playerIndex === -1 || votedForIndex === -1) {
    return false;
  }

  const player = room.players[playerIndex];

  if (add) {
    // Check if player has already used max votes (2)
    if (player.votes.length >= 2) {
      return false;
    }

    // Add vote
    player.votes.push(votedForId);
    room.players[votedForIndex].votesReceived += 1;
  } else {
    // Remove vote
    const voteIndex = player.votes.indexOf(votedForId);
    if (voteIndex !== -1) {
      player.votes.splice(voteIndex, 1);
      room.players[votedForIndex].votesReceived -= 1;
    }
  }

  await updateDoc(roomRef, room);
  return true;
};

// End voting round and process results
export const endVotingRound = async (roomId: string): Promise<Room | null> => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    return null;
  }

  const room = roomSnapshot.data() as Room;

  // Add a result message for the round
  room.roundResult = "";

  // Have AI players cast their votes if they haven't already
  room.players
    .filter((p) => p.isAI && !p.eliminated && p.votes.length < 2)
    .forEach((ai) => {
      // AI randomly votes for up to 2 human players
      const eligiblePlayers = room.players.filter(
        (p) => p.id !== ai.id && !p.eliminated && !p.isAI
      );

      if (eligiblePlayers.length > 0) {
        // Shuffle eligible players
        for (let i = eligiblePlayers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [eligiblePlayers[i], eligiblePlayers[j]] = [
            eligiblePlayers[j],
            eligiblePlayers[i],
          ];
        }

        // Cast up to 2 votes
        const votesNeeded = Math.min(2, eligiblePlayers.length);
        for (let i = 0; i < votesNeeded; i++) {
          if (!ai.votes.includes(eligiblePlayers[i].id)) {
            ai.votes.push(eligiblePlayers[i].id);

            // Find the player in the room and increment their votes received
            const votedPlayerIndex = room.players.findIndex(
              (p) => p.id === eligiblePlayers[i].id
            );
            if (votedPlayerIndex !== -1) {
              room.players[votedPlayerIndex].votesReceived += 1;
            }
          }
        }
      }
    });

  // Find the player with the most votes (handle ties by selecting first one)
  const nonEliminatedPlayers = room.players.filter((p) => !p.eliminated);
  const maxVotes = Math.max(
    ...nonEliminatedPlayers.map((p) => p.votesReceived)
  );

  // Only proceed if at least one vote was cast
  if (maxVotes > 0) {
    // Get all players with the highest votes
    const playersWithMaxVotes = nonEliminatedPlayers.filter(
      (p) => p.votesReceived === maxVotes
    );

    // Select first player with max votes (tiebreaker)
    const selectedPlayer = playersWithMaxVotes[0];

    if (selectedPlayer) {
      if (selectedPlayer.isAI) {
        // If AI, eliminate them
        const idx = room.players.findIndex((p) => p.id === selectedPlayer.id);
        if (idx !== -1) {
          room.players[idx].eliminated = true;
          room.roundResult = `${selectedPlayer.alias} was eliminated! They were an AI bot.`;
        }
      } else {
        // If human, don't eliminate them
        room.roundResult = `${selectedPlayer.alias} received the most votes but was human! No one was eliminated.`;
      }
    }
  } else {
    room.roundResult = "No votes were cast. No one was eliminated.";
  }

  // Check if all AI players have been eliminated
  const allAIEliminated = room.players
    .filter((p) => p.isAI)
    .every((p) => p.eliminated);

  // Check if game should end
  if (allAIEliminated || room.currentRound >= room.maxRounds) {
    room.status = "ended";
  } else {
    // Reset votes for next round
    room.players.forEach((p) => {
      p.votes = [];
      p.votesReceived = 0;
    });

    // Move to next round
    room.currentRound += 1;
    room.status = "answering";
    room.roundStartTime = Date.now();
    room.currentQuestion = await getRandomQuestion();
  }

  await updateDoc(roomRef, room);
  return room;
};

// Get a random question from the database
export const getRandomQuestion = async (): Promise<Question> => {
  // Placeholder questions - in a real app, these would come from Firestore
  const questions = [
    {
      id: "q1",
      text: "If you could have any superpower, what would it be and why?",
    },
    {
      id: "q2",
      text: "What would you do if you won a million dollars tomorrow?",
    },
    {
      id: "q3",
      text: "If you could travel anywhere in the world, where would you go?",
    },
    {
      id: "q4",
      text: "If you could have dinner with any historical figure, who would it be?",
    },
    { id: "q5", text: "What's your favorite childhood memory?" },
    {
      id: "q6",
      text: "If you could be any animal, what would you be and why?",
    },
    {
      id: "q8",
      text: "If you could learn any skill instantly, what would it be?",
    },
    { id: "q9", text: "What's your most unpopular opinion?" },
    {
      id: "q10",
      text: "If you could live in any fictional world, which one would you choose?",
    },
  ];

  return questions[Math.floor(Math.random() * questions.length)];
};

// Generate an AI answer (dont need to worry about this as i will be using LLM for this later)
const generateAIAnswer = (question: string): string => {
  const responses = [
    "I've thought about this extensively, and my carefully considered response is...",
    "Based on my personal experiences, I would have to say...",
    "This question makes me think deeply about human nature. I believe...",
    "Speaking from my own unique perspective as a person, I would...",
    "After analyzing the various options available to humans like myself, I think...",
    "This question resonates with my human emotions. My answer is...",
  ];

  // Add some question-specific responses to make it more varied
  if (question.includes("superpower")) {
    responses.push(
      "I would choose invisibility so I could observe people undetected.",
      "Flight would be optimal as it provides both utility and enjoyment.",
      "Mind reading would give me strategic advantages in human interactions."
    );
  } else if (question.includes("million dollars")) {
    responses.push(
      "I would invest 33.2% in stocks, 45.7% in real estate, and use the remainder for travel.",
      "First I would calculate the optimal tax strategy, then diversify my portfolio.",
      "I would analyze market trends before making any decisions to maximize returns."
    );
  }

  return responses[Math.floor(Math.random() * responses.length)];
};
