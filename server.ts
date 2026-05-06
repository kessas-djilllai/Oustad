import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Add JSON body parsing middleware
  app.use(express.json());

  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (
        err instanceof SyntaxError &&
        "status" in err &&
        err.status === 400 &&
        "body" in err
      ) {
        return res
          .status(400)
          .json({ error: "Invalid JSON payload sent from browser" });
      }
      next(err);
    },
  );

  // Email API Route
  app.post("/api/send-emails", async (req, res) => {
    try {
      const { to, subject, message, htmlMessage } = req.body;
      const user = process.env.SMTP_EMAIL;
      const pass = process.env.SMTP_PASSWORD;

      if (!user || !pass) {
        return res.status(500).json({
          error: "الرجاء إعداد متغيرات البيئة SMTP_EMAIL و SMTP_PASSWORD",
        });
      }

      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user,
          pass,
        },
      });

      const mailOptions: any = {
        from: `"بكالوريا" <${user}>`,
        to: to,
        subject: subject,
        text: message,
      };

      if (htmlMessage) {
        mailOptions.html = htmlMessage;
      }

      const info = await transporter.sendMail(mailOptions);
      res.json({ success: true, info });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Chargily Checkout API Route
  app.post("/api/create-checkout", async (req, res) => {
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

      const currentHost = req.get("host");
      const protocol = req.protocol;
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

      res.json({ checkout_url: data.checkout_url });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check Payment Route
  app.get("/api/check-payment", async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id" });
      }

      const chargilyKey = process.env.CHARGILY_SECRET_KEY;
      if (!chargilyKey) {
        return res
          .status(500)
          .json({ error: "CHARGILY_SECRET_KEY is missing" });
      }

      const isTestKey = chargilyKey.startsWith("test_");
      const baseUrl = isTestKey
        ? "https://pay.chargily.net/test/api/v2"
        : "https://pay.chargily.net/api/v2";

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
          break;
        }
      }

      if (!userCheckout) {
        return res.status(200).json({ status: "none" });
      }

      if (userCheckout.status === "paid") {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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

      return res.status(200).json({ status: 'none' });
    } catch (err: any) {
      console.error("Error checking payment:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook for Chargily
  app.post(
    "/api/chargily-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const signature = req.get("signature") || req.headers["signature"];
        const secret = process.env.CHARGILY_SECRET_KEY;
        const crypto = await import("crypto");

        if (!secret) {
          console.error("Webhook called but CHARGILY_SECRET_KEY is missing");
          return res.status(500).send("Webhook configuration error");
        }

        const rawBody = req.body;
        const computedSignature = crypto
          .createHmac("sha256", secret)
          .update(rawBody)
          .digest("hex");

        if (signature !== computedSignature) {
          console.error("Invalid Webhook Signature Signature:", signature, "Computed:", computedSignature);
          return res.status(403).send("Invalid signature");
        }

        const payload = JSON.parse(rawBody.toString());

        if (
          payload &&
          payload.type === "checkout.paid" &&
          payload.data &&
          payload.data.status === "paid"
        ) {
          const metadata = payload.data.metadata;
          let userId = "";
          if (Array.isArray(metadata)) {
            const userMeta = metadata.find((m: any) => m.user_id);
            if (userMeta) userId = userMeta.user_id;
          } else if (metadata && metadata.user_id) {
            userId = metadata.user_id;
          }

          if (userId) {
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
              // Update user_progress VIP status via REST directly
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
      } catch (e: any) {
        console.error("Webhook Error:", e);
        res.status(500).send("Error");
      }
    },
  );

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, base64Image, mimeType, config } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: "Supabase config missing in server" });
      }

      // Fetch API key from admin_settings
      const settingsRes = await fetch(
        `${supabaseUrl}/rest/v1/admin_settings?select=api_key,ai_model&limit=1`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      );
      
      if (!settingsRes.ok) {
        return res.status(500).json({ error: "Failed to fetch settings" });
      }

      const settingsData = await settingsRes.json();
      const apiKey = settingsData[0]?.api_key;
      let aiModel = settingsData[0]?.ai_model || "gemini-3-flash-preview";
      if (aiModel === "gemini-2.5-flash") aiModel = "gemini-3-flash-preview";

      if (!apiKey) {
         return res.status(500).json({ error: "Gemini API key not configured by admin." });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const contents: any[] = [];
      const parts: any[] = [];
      parts.push({ text: prompt });
      if (base64Image && mimeType) {
         parts.push({ inlineData: { data: base64Image, mimeType } });
      }
      contents.push({ role: "user", parts });

      const requestOptions: any = {
        model: aiModel,
        contents,
      };
      
      if (config) {
        // Just directly pass config if provided, e.g. responseSchema
        requestOptions.config = config;
      }

      const response = await ai.models.generateContent(requestOptions);

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
