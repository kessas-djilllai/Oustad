import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    res.status(200).json({ success: true, info });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: error.message });
  }
}
