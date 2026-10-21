import { PenFightEngine, SHRINK_TURNS } from '../physics/PenFightEngine';

export function getTopStatusPillText(engine: PenFightEngine, mode: 'ai' | '2p'): {
  dotColor: string;
  text: string;
} {
  if (engine.phase === 'AI_THINKING') {
    return { dotColor: '#3b82f6', text: 'Computer · Thinking' };
  }
  if (engine.phase === 'AI_PULLING') {
    return { dotColor: '#3b82f6', text: "Computer's turn" };
  }

  // Show shrink warning on turns 15, 19, 23, 27
  if (SHRINK_TURNS.includes(engine.turnCount)) {
    return { dotColor: '#dc2626', text: '⚠️ Desk shrinks after this turn' };
  }

  // Show countdown from Turn 9 to Turn 14 ("6 normal turns left" ... "1 normal turn left")
  if (engine.turnCount >= 9 && engine.turnCount < 15) {
    const left = 15 - engine.turnCount;
    return {
      dotColor: engine.activePlayer === 1 ? '#e06d3b' : '#3b82f6',
      text: `${left} normal ${left === 1 ? 'turn' : 'turns'} left`
    };
  }

  if (engine.shrinkSteps > 0) {
    return {
      dotColor: '#ea580c',
      text: '⚠️ Desk smaller · stay inside the line'
    };
  }

  if (mode === 'ai') {
    return {
      dotColor: engine.activePlayer === 1 ? '#e06d3b' : '#3b82f6',
      text: engine.activePlayer === 1 ? 'Your turn' : "Computer's turn"
    };
  }

  return {
    dotColor: engine.activePlayer === 1 ? '#e06d3b' : '#3b82f6',
    text: engine.activePlayer === 1 ? "Player 1's turn" : "Player 2's turn"
  };
}
