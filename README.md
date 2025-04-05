# AI Among Us

A web-based multiplayer deduction game where players try to find the AI bots among the real players.

## Game Overview

"AI Among Us" is similar to social deduction games like Werewolf, but the "werewolves" are AI bots. Players must carefully analyze everyone's answers to questions and try to identify which players are not human.

### How to Play

1. **Create a Game**: Start by creating a room and choosing how many AI bots to include.
2. **Join a Game**: Players join using a room code (similar to Kahoot).
3. **Start the Game**: The host starts the game when ready.
4. **Answer Questions**: Each round, players answer a random question within the time limit.
5. **Vote**: After everyone has answered, players vote for who they think is an AI bot (max 2 votes per round).
6. **Elimination**: The player(s) with the most votes get eliminated.
7. **Game End**: The game continues until all AI bots are eliminated (humans win) or the maximum number of rounds is reached (AI wins).

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
