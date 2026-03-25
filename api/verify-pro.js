// Gumroad Webhook — called when a sale is completed
// Gumroad sends a POST with sale data to this endpoint
// We verify it's legit then mark the user as PRO in Supabase (add later)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      seller_id,
      product_permalink,
      email,
      sale_id,
      refunded,
    } = req.body;

    // 1. Verify it's from your Gumroad account
    if (seller_id !== process.env.GUMROAD_SELLER_ID) {
      console.warn('Invalid seller_id:', seller_id);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Verify it's for your product
    if (product_permalink !== 'grindvault') {
      return res.status(400).json({ error: 'Wrong product' });
    }

    // 3. Handle refund — revoke PRO
    if (refunded) {
      console.log(`Refund for ${email} — revoke PRO`);
      // TODO: update Supabase users set is_pro = false where email = email
      return res.status(200).json({ status: 'refund_processed' });
    }

    // 4. Grant PRO
    console.log(`New PRO sale: ${email} (${sale_id})`);
    // TODO: update Supabase users set is_pro = true where email = email
    // For now, log it. Add Supabase integration in next step.

    return res.status(200).json({ status: 'ok', email, sale_id });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
