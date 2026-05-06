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
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 24px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 22px; font-weight: 800; color: #1e293b;">🎓 منصة بكالوريا</span>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td align="center" style="padding: 40px 32px; text-align: center; direction: rtl;">
              <h2 style="margin: 0 0 24px 0; color: #1e293b; font-size: 26px; font-weight: 800;">
                مرحباً${userName ? ' ' + userName : ''}
              </h2>
              
              <div style="color: #475569; font-size: 18px; line-height: 1.6; margin-bottom: ${(buttonText || buttonLink) ? '32px' : '0'}; text-align: center;">
                ${messageHtml}
              </div>

              ${(buttonText || buttonLink) ? `
              <!-- Call to Action -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <a href="${buttonLink || '#'}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: bold; padding: 14px 40px; border-radius: 9999px;">
                      ${buttonText || 'انقر هنا'}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 32px 24px; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 15px; font-weight: 500; text-align: center;">
                تم إرسال هذه الرسالة من منصة بكالوريا.
              </p>
              <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 15px; font-weight: 500; text-align: center;">
                إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 14px; text-align: center; direction: ltr;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة.
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
