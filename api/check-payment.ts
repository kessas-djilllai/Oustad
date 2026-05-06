export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  const chargilyKey = process.env.CHARGILY_SECRET_KEY;
  if (!chargilyKey) {
    return res.status(500).json({ error: "CHARGILY_SECRET_KEY is missing" });
  }

  const isTestKey = chargilyKey.startsWith("test_");
  const baseUrl = isTestKey
    ? "https://pay.chargily.net/test/api/v2"
    : "https://pay.chargily.net/api/v2";

  try {
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${chargilyKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch checkouts: ${response.status}`);
    }

    const data = await response.json();
    const checkouts = data.data || [];

    // Find the latest checkout for this user
    let userCheckout = null;
    for (const checkout of checkouts) {
      const metadata = checkout.metadata;
      let checkoutUserId = "";
      if (Array.isArray(metadata)) {
        const m = metadata.find((x: any) => x.user_id);
        if (m) checkoutUserId = m.user_id;
      } else if (metadata && metadata.user_id) {
        checkoutUserId = metadata.user_id;
      }

      if (checkoutUserId === user_id) {
        userCheckout = checkout;
        break; // Since checkouts is sorted by newest first, we get the most recent one
      }
    }

    if (!userCheckout) {
      return res.status(200).json({ status: "none" });
    }

    if (userCheckout.status === "paid") {
      // Optional: Ensure Supabase knows about it (fallback for Webhook)
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const fetchUrl = `${supabaseUrl}/rest/v1/user_progress`;
        try {
          const checkRes = await fetch(
            `${fetchUrl}?user_id=eq.${user_id}&item_type=eq.system&item_id=eq.is_vip`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          );
          const checkData = await checkRes.json();
          if (checkData && checkData.length === 0) {
            // Insert VIP role
            await fetch(`${fetchUrl}`, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user_id,
                item_type: "system",
                item_id: "is_vip",
                progress_value: 1,
              }),
            });
          }
        } catch (e) {
          console.error("Failed to sync VIP status from check-payment:", e);
        }
      }
      return res.status(200).json({ status: "paid" });
    }

    if (userCheckout.status === 'pending') {
       return res.status(200).json({ status: 'pending', url: userCheckout.checkout_url });
    }

    if (userCheckout.status === 'failed' || userCheckout.status === 'canceled') {
       return res.status(200).json({ status: 'failed' });
    }

    // Default catching other states as 'none' to allow retry
    return res.status(200).json({ status: 'none' });
  } catch (err: any) {
    console.error("Error checking payment:", err);
    res.status(500).json({ error: err.message });
  }
}
