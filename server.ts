import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Add JSON body parsing middleware
  app.use(express.json());

  // Email API Route
  app.post("/api/send-emails", async (req, res) => {
    try {
      const { to, subject, message, htmlMessage } = req.body;
      const user = process.env.SMTP_EMAIL;
      const pass = process.env.SMTP_PASSWORD;
      
      if (!user || !pass) {
        return res.status(500).json({ error: "الرجاء إعداد متغيرات البيئة SMTP_EMAIL و SMTP_PASSWORD" });
      }

      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });

      const mailOptions: any = {
        from: `"بكالوريا" <${user}>`,
        to: to,
        subject: subject,
        text: message
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
        return res.status(500).json({ error: "الرجاء إعداد متغير البيئة CHARGILY_SECRET_KEY" });
      }

      if (!amount || !success_url || !failure_url) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const response = await fetch("https://pay.chargily.net/test/api/v2/checkouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${chargilyKey}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: "dzd",
          success_url: success_url,
          failure_url: failure_url,
          metadata: [{ user_id: user_id || '' }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout");
      }

      res.json({ checkout_url: data.checkout_url });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ error: error.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
