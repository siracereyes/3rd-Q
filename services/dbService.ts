
import { QuizResult } from '../types';

/**
 * Communicates with the Vercel Serverless Function (api/leaderboard.ts)
 */

export const saveResult = async (result: QuizResult): Promise<void> => {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save score to database');
    }
  } catch (error) {
    console.error('Database Error:', error);
    // Fallback for local preview if API is not deployed
    const existing = localStorage.getItem('ethereal_fallback_db');
    const db = existing ? JSON.parse(existing) : [];
    db.push(result);
    localStorage.setItem('ethereal_fallback_db', JSON.stringify(db));
  }
};

export const getTopScores = async (limit: number = 10): Promise<QuizResult[]> => {
  try {
    const response = await fetch(`/api/leaderboard?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json();
  } catch (error) {
    console.error('Leaderboard Fetch Error:', error);
    // Fallback for local preview
    const existing = localStorage.getItem('ethereal_fallback_db');
    const db: QuizResult[] = existing ? JSON.parse(existing) : [];
    return db
      .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp)
      .slice(0, limit);
  }
};
