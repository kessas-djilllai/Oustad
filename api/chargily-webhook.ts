export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body;

    if (
      payload &&
      payload.type === "checkout.paid" &&
      payload.data &&
      payload.data.status === "paid"
    ) {
      const metadata = payload.data.metadata;
      let userId = "";
      if (Array.isArray(metadata)) {
        const userMeta = metadata.find((m) => m.user_id);
        if (userMeta) userId = userMeta.user_id;
      } else if (metadata && metadata.user_id) {
        userId = metadata.user_id;
      }

      if (userId) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const fetchUrl = `${supabaseUrl}/rest/v1/user_progress`;

          // First check if VIP record exists
          const checkRes = await fetch(
            `${fetchUrl}?user_id=eq.${userId}&item_type=eq.system&item_id=eq.is_vip`,
            {
              method: "GET",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          );
          const checkData = await checkRes.json();

          if (checkData && checkData.length > 0) {
            // Update
            await fetch(`${fetchUrl}?id=eq.${checkData[0].id}`, {
              method: "PATCH",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ progress_value: 1 }),
            });
          } else {
            // Insert
            await fetch(`${fetchUrl}`, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: userId,
                item_type: "system",
                item_id: "is_vip",
                progress_value: 1,
              }),
            });
          }
        }
      }
    }

    res.status(200).send("Webhook received");
  } catch (e) {
    console.error("Webhook Error:", e);
    res.status(500).send("Error");
  }
}
