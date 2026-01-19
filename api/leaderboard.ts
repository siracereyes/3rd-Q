
import { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// The DATABASE_URL is provided by Vercel when you link the Neon project
const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const { firstName, lastName, section, score, totalQuestions } = req.body;
      
      // Get IP address from request headers (standard for Vercel/Proxies)
      const forwarded = req.headers['x-forwarded-for'];
      const ipAddress = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';
      
      await sql`
        INSERT INTO leaderboard (first_name, last_name, section, score, total_questions, ip_address)
        VALUES (${firstName}, ${lastName}, ${section}, ${score}, ${totalQuestions}, ${ipAddress})
      `;

      return res.status(201).json({ message: 'Score saved successfully' });
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

      // Convert Postgres timestamp to numeric for the frontend
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
