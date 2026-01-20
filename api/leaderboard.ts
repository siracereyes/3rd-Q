
import { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// The DATABASE_URL is provided by Vercel when you link the Neon project
const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const { firstName, lastName, section, score, totalQuestions } = req.body;
      
      // Get IP address from request headers
      const forwarded = req.headers['x-forwarded-for'];
      const ipAddress = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';
      
      /**
       * UPSERT Logic:
       * 1. Try to INSERT the record.
       * 2. If (first_name, last_name, section) already exists (Conflict):
       * 3. Update the existing record ONLY IF the new score is higher.
       */
      await sql`
        INSERT INTO leaderboard (first_name, last_name, section, score, total_questions, ip_address)
        VALUES (${firstName}, ${lastName}, ${section}, ${score}, ${totalQuestions}, ${ipAddress})
        ON CONFLICT (first_name, last_name, section) 
        DO UPDATE SET
          score = EXCLUDED.score,
          total_questions = EXCLUDED.total_questions,
          ip_address = EXCLUDED.ip_address,
          created_at = NOW()
        WHERE EXCLUDED.score > leaderboard.score
      `;

      return res.status(201).json({ message: 'Score processed' });
    } 
    
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const rows = await sql`
        SELECT 
          first_name as "firstName", 
          last_name as "lastName", 
          section, 
          score, 
          total_questions as "totalQuestions", 
          created_at as "timestamp",
          ip_address as "ipAddress"
        FROM leaderboard
        ORDER BY score DESC, created_at ASC
        LIMIT ${limit}
      `;

      const results = rows.map(row => ({
        ...row,
        timestamp: new Date(row.timestamp).getTime()
      }));

      return res.status(200).json(results);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with Neon Database' });
  }
}
