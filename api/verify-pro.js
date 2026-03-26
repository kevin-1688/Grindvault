// api/load.js
// Loads all user data from Supabase for cloud sync
// Called on login to restore data across devices

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function supabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      'apikey': SUPABASE_SECRET_KEY,
      'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://kevin-1688.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  try {
    // Load user profile (is_pro status)
    const users = await supabase(`/users?id=eq.${user_id}&select=*`);
    const user = users[0] || null;

    // Load last 50 transactions
    const transactions = await supabase(
      `/transactions?user_id=eq.${user_id}&order=created_at.desc&limit=50&select=*`
    );

    // Load last 30 fitness logs
    const fitness = await supabase(
      `/fitness_logs?user_id=eq.${user_id}&order=created_at.desc&limit=30&select=*`
    );

    return res.status(200).json({
      user,
      transactions,
      fitness,
    });

  } catch (err) {
    console.error('load error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
