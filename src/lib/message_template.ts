export function message_template({ userName, messageText, buttonText, buttonLink }: { userName?: string, messageText: string, buttonText?: string, buttonLink?: string }) {
  const messageHtml = messageText.replace(/\n/g, '<br/>');
  
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسالة جديدة من منصة بكالوريا</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 40px 20px;">
              <!-- Placeholder for logo / icon -->
              <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; text-align: center;">
                <span style="font-size: 30px; color: #ffffff; line-height: 60px;">🎓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">منصة بكالوريا</h1>
              <p style="margin: 8px 0 0 0; color: #bfdbfe; font-size: 16px; font-weight: 500;">بوابتك نحو التفوق</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 32px; text-align: right; direction: rtl;">
              <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 22px; font-weight: 700;">
                مرحباً${userName ? ' ' + userName : ''}،
              </h2>
              
              <div style="color: #475569; font-size: 17px; line-height: 1.8; margin-bottom: 32px;">
                ${messageHtml}
              </div>

              ${(buttonText && buttonLink) ? `
              <!-- Call to Action -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <a href="${buttonLink}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -2px rgba(37, 99, 235, 0.2); transition: all 0.3s ease;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 16px; font-size: 14px; color: #94a3b8;">
                إذا كان الزر لا يعمل، يمكنك نسخ الرابط التالي:<br>
                <a href="${buttonLink}" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">${buttonLink}</a>
              </div>
              ` : ''}
              
              <!-- Signature -->
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                <p style="margin: 0; color: #64748b; font-size: 16px; font-weight: 600;">مع تمنياتنا لك بالتوفيق والنجاح،</p>
                <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 15px;">فريق منصة بكالوريا</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f1f5f9; padding: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                وصلتك هذه الرسالة لأنك مسجل في منصة بكالوريا.<br>
                © ${new Date().getFullYear()} منصة بكالوريا. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
