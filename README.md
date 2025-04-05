# Find the Fake Human

A web-based multiplayer deduction game where players try to find the AI bots among the real players.

## Game Overview

"Find the Fake Human" is similar to social deduction games like Werewolf, but with a twist - the "werewolves" are AI bots! Players must carefully analyze everyone's answers to questions and try to identify which players are not human.

### How to Play

1. **Create a Game**: Start by creating a room and choosing how many AI bots to include.
2. **Join a Game**: Players join using a room code (similar to Kahoot).
3. **Start the Game**: The host starts the game when ready.
4. **Answer Questions**: Each round, players answer a random question within the time limit.
5. **Vote**: After everyone has answered, players vote for who they think is an AI bot (max 2 votes per round).
6. **Elimination**: The player(s) with the most votes get eliminated.
7. **Game End**: The game continues until all AI bots are eliminated (humans win) or the maximum number of rounds is reached (AI wins).

## Setup Instructions

### Prerequisites

- Node.js v18+ and npm
- Firebase account (for Firestore database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd find-the-fake-human
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Firestore Database
   - In the project settings, add a new web app
   - Copy the Firebase configuration object
   - Update `src/lib/firebase.ts` with your Firebase configuration:

```typescript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. Configure Firestore Database Rules:
   - In the Firebase Console, go to Firestore Database
   - Go to Rules tab and update the rules to:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
      // Note: These are permissive rules for development.
      // For production, implement proper security rules.
    }
  }
}
```

5. Run the development server:
```bash
npm run dev
```

6. Visit `http://localhost:3000` in your browser to play the game.

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [Firebase/Firestore](https://firebase.google.com/) - Real-time database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- Pixel art styling inspired by games like Undertale

## Future Enhancements

- Add sound effects and background music
- Implement more sophisticated AI responses
- Add spectator mode
- Create persistent user accounts and statistics
- Add more question categories
