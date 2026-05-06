export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, success_url, failure_url, user_id } = req.body;
    const chargilyKey = process.env.CHARGILY_SECRET_KEY;

    if (!chargilyKey) {
      return res
        .status(500)
        .json({ error: "الرجاء إعداد متغير البيئة CHARGILY_SECRET_KEY" });
    }

    const isTestKey = chargilyKey.startsWith("test_");
    const baseUrl = isTestKey
      ? "https://pay.chargily.net/test/api/v2"
      : "https://pay.chargily.net/api/v2";

    const currentHost = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const appUrl = `${protocol}://${currentHost}`;
    const webhook_endpoint = `${appUrl}/api/chargily-webhook`;

    if (!amount || !success_url || !failure_url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chargilyKey}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "dzd",
        success_url: success_url,
        failure_url: failure_url,
        webhook_endpoint: webhook_endpoint,
        metadata: [{ user_id: user_id || "" }],
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      throw new Error(
        `Empty or invalid response from chargily: ${response.status} ${responseText}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || "Failed to create checkout",
      );
    }

    res.status(200).json({ checkout_url: data.checkout_url });
  } catch (error) {
    console.error("Error creating checkout:", error);
    res.status(500).json({ error: error.message });
  }
}
