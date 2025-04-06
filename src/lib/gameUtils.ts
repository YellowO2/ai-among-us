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
} from "firebase/firestore";
import { Room, Player, Question } from "../types/game";
import { generateAIAnswer } from "./aiUtils";

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
    "Grumpy",
    "Dopey",
    "PHD",
    "Lonely",
    "Clever",
    "Brave",
    "Sad",
    "Stupid",
    "Silly",
    "Slimy",
    "Sleepy",
    "Evil",
    "Japanese",
  ];
  const nouns = [
    "Turtle",
    "Wizard",
    "Knight",
    "Bunny",
    "Panda",
    "Fox",
    "Otter",
    "Potato",
    "Ninja",
    "Bot",
    "Robot",
    "Alien",
    "Zombie",
    "Ghost",
    "Human",
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
    answeringTime: 30, // Default 30 seconds for answering
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

  // Calculate max votes based on player count
  const totalPlayers = currentPlayerCount + room.aiCount;
  room.maxVotesPerPlayer = totalPlayers <= 5 ? 1 : 2;

  // Set game to answering state
  room.status = "answering";
  room.currentRound = 1;
  room.roundStartTime = Date.now();

  // Select first question
  room.currentQuestion = await getRandomQuestion();

  await updateDoc(roomRef, { ...room });
  return room;
};

// Submit answer with updated signature to handle human answers context
export const submitAnswer = async (
  roomId: string,
  playerId: string,
  answer: string,
  isLastHumanToAnswer: boolean = false
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

  // If this is the last human to answer, collect all human answers and generate AI responses
  if (isLastHumanToAnswer) {
    // Get all human answers for this round to use as context
    const humanAnswers = room.players
      .filter((p) => !p.isAI && !p.eliminated)
      .flatMap((p) => p.answers)
      .filter((a) => a.round === room.currentRound)
      .map((a) => a.content);

    // Get all AI players who need to answer
    const aiPlayers = room.players.filter(
      (p) => p.isAI && p.answers.length < room.currentRound && !p.eliminated
    );

    if (aiPlayers.length > 0) {
      // Process AI answers in parallel with human answers as context
      const aiAnswerPromises = aiPlayers.map(async (ai) => {
        const aiResponse = await generateAIAnswer(
          room.currentQuestion!.text,
          humanAnswers
        );
        return {
          player: ai,
          response: aiResponse,
        };
      });

      const aiAnswers = await Promise.all(aiAnswerPromises);

      // Add the generated answers to the AI players
      aiAnswers.forEach(({ player, response }) => {
        const aiIndex = room.players.findIndex((p) => p.id === player.id);
        if (aiIndex !== -1) {
          room.players[aiIndex].answers.push({
            questionId: room.currentQuestion!.id,
            content: response,
            round: room.currentRound,
          });
        }
      });
    }
  }

  // Check if all players have answered
  const allAnswered = room.players.every(
    (p) => p.answers.some((a) => a.round === room.currentRound) || p.eliminated
  );

  // Move to voting phase if all players have answered
  if (allAnswered) {
    room.status = "voting";
    room.roundStartTime = Date.now();
  }

  await updateDoc(roomRef, { ...room });
  return true;
};

// New function to check timer and progress game if needed
export const checkAndUpdateGameState = async (
  roomId: string
): Promise<Room | null> => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);

  if (!roomSnapshot.exists()) {
    return null;
  }

  const room = roomSnapshot.data() as Room;
  const currentTime = Date.now();
  let stateChanged = false;

  // Check if we need to move from answering to voting
  if (room.status === "answering") {
    const timeElapsed = currentTime - room.roundStartTime;
    const timeExpired = timeElapsed >= room.answeringTime * 1000;

    if (timeExpired) {
      // Get all human answers for this round to use as context
      const humanAnswers = room.players
        .filter((p) => !p.isAI && !p.eliminated)
        .flatMap((p) => p.answers)
        .filter((a) => a.round === room.currentRound)
        .map((a) => a.content);

      // Make sure all AI players have answered before moving to voting
      const aiPlayersWithoutAnswers = room.players.filter(
        (p) =>
          p.isAI &&
          !p.eliminated &&
          !p.answers.some((a) => a.round === room.currentRound)
      );

      if (aiPlayersWithoutAnswers.length > 0) {
        const aiAnswerPromises = aiPlayersWithoutAnswers.map(async (ai) => {
          const aiResponse = await generateAIAnswer(
            room.currentQuestion!.text,
            humanAnswers
          );
          return {
            player: ai,
            response: aiResponse,
          };
        });

        const aiAnswers = await Promise.all(aiAnswerPromises);

        aiAnswers.forEach(({ player, response }) => {
          const aiIndex = room.players.findIndex((p) => p.id === player.id);
          if (aiIndex !== -1) {
            room.players[aiIndex].answers.push({
              questionId: room.currentQuestion!.id,
              content: response,
              round: room.currentRound,
            });
          }
        });
      }

      room.status = "voting";
      room.roundStartTime = currentTime;
      stateChanged = true;
    }
  }
  // Check if we need to move from voting to the next round
  else if (room.status === "voting") {
    const timeElapsed = currentTime - room.roundStartTime;
    const timeExpired = timeElapsed >= room.votingTime * 1000;

    if (timeExpired) {
      // Execute the end voting round logic
      await endVotingRound(roomId);
      return await getDoc(roomRef).then((doc) => doc.data() as Room);
    }
  }

  // Only update the database if we changed something
  if (stateChanged) {
    await updateDoc(roomRef, { ...room });
  }

  return room;
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
  const maxVotes = room.maxVotesPerPlayer || (room.players.length <= 5 ? 1 : 2); // Fallback for existing games

  if (add) {
    // Check if player has already used max votes
    if (player.votes.length >= maxVotes) {
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

  await updateDoc(roomRef, { ...room });
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

  // Get max votes per player for this room
  const maxVotesPerPlayer =
    room.maxVotesPerPlayer || (room.players.length <= 5 ? 1 : 2);

  // Have AI players cast their votes if they haven't already
  room.players
    .filter(
      (p) => p.isAI && !p.eliminated && p.votes.length < maxVotesPerPlayer
    )
    .forEach((ai) => {
      // AI votes for human players (not other AIs)
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

        // Cast votes up to the maximum allowed
        const votesNeeded = Math.min(maxVotesPerPlayer, eligiblePlayers.length);
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

  // Check if voting time is up without any human votes
  const humanVotes = room.players
    .filter((p) => !p.isAI)
    .reduce((total, p) => total + p.votes.length, 0);

  if (humanVotes === 0) {
    room.roundResult =
      "No votes were cast by human players. Voting will be skipped for this round.";

    // Reset votes for next round
    room.players.forEach((p) => {
      p.votes = [];
      p.votesReceived = 0;
    });

    // Check if we've reached max rounds
    if (room.currentRound >= room.maxRounds) {
      room.status = "ended";
    } else {
      // Move to next round without elimination
      room.currentRound += 1;
      room.status = "answering";
      room.roundStartTime = Date.now();
      room.currentQuestion = await getRandomQuestion();

      await updateDoc(roomRef, { ...room });
      return room;
    }
  }

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

  await updateDoc(roomRef, { ...room });
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
