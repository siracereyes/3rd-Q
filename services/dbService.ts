
import { QuizResult } from '../types';

const LEADERBOARD_KEY = 'ethereal_leaderboard';

/**
 * In a real Vercel deployment, you would use an API route to interact with Vercel KV or Postgres.
 * Example API call:
 * const response = await fetch('/api/results', {
 *   method: 'POST',
 *   body: JSON.stringify(result)
 * });
 */

export const saveResult = async (result: QuizResult): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const existing = localStorage.getItem(LEADERBOARD_KEY);
  const leaderboard: QuizResult[] = existing ? JSON.parse(existing) : [];
  
  leaderboard.push(result);
  
  // Sort by score (desc) and timestamp (asc for ties)
  leaderboard.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);
  
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
};

export const getTopScores = async (limit: number = 10): Promise<QuizResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const existing = localStorage.getItem(LEADERBOARD_KEY);
  const leaderboard: QuizResult[] = existing ? JSON.parse(existing) : [];
  return leaderboard.slice(0, limit);
};
