// api/sync.js
// Saves user transactions and fitness logs to Supabase
// Called after each entry submission by a logged-in PRO user

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function supabase(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SECRET_KEY,
      'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://kevin-1688.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, type, data } = req.body;
    if (!user_id || !type || !data) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    if (type === 'transaction') {
      await supabase('/transactions', 'POST', {
        user_id,
        type: data.type,
        amount: data.amount,
        category: data.category || null,
        note: data.note || null,
      });
    } else if (type === 'fitness') {
      await supabase('/fitness_logs', 'POST', {
        user_id,
        log_type: data.log_type,
        data: data.payload,
      });
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    return res.status(200).json({ status: 'saved' });

  } catch (err) {
    console.error('sync error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
