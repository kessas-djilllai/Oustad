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
      const { user, pass, to, subject, message } = req.body;
      
      if (!user || !pass || !to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });

      const mailOptions = {
        from: user,
        bcc: Array.isArray(to) ? to.join(',') : to,
        subject: subject,
        text: message
      };

      const info = await transporter.sendMail(mailOptions);
      res.json({ success: true, info });
    } catch (error: any) {
      console.error("Error sending email:", error);
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
