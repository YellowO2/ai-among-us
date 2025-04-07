export type GameStatus =
  | "waiting"
  | "answering"
  | "voting"
  | "results"
  | "ended";

export interface Player {
  id: string;
  name: string; // Real identifier
  alias: string; // In-game alias
  isAI: boolean;
  isHost: boolean;
  answers: Answer[];
  votes: string[]; // IDs of players they voted for in current round
  votesReceived: number; // Number of votes received in current round
  totalVotesReceived: number; // Total votes received across all rounds
  eliminated: boolean;
}

export interface Answer {
  questionId: string;
  content: string;
  round: number;
}

export interface Question {
  id: string;
  text: string;
}

export interface Room {
  id: string;
  code: string;
  host: string; // Player ID of the host
  players: Player[];
  status: GameStatus;
  currentRound: number;
  maxRounds: number;
  aiCount: number;
  currentQuestion?: Question;
  roundStartTime: number; // Timestamp for when the current round started
  answeringTime: number; // Time in seconds for answering phase
  votingTime: number; // Time in seconds for voting phase
  roundResult?: string; // Message about the result of the voting round
  maxVotesPerPlayer?: number; // Number of votes each player gets (1 for ≤5 players, 2 for >5)
  humansWon?: boolean; // Whether humans won (determined at game end)
  gameResult?: string; // Final result message
}

export interface GameState {
  room: Room | null;
  currentPlayer: Player | null;
  timeLeft: number;
  currentAnswer?: string;
  isSubmitting?: boolean;
}
