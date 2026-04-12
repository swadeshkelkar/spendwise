const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'SpendWise <onboarding@resend.dev>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function sendVerificationEmail(to, name, token) {
  const link = `${CLIENT_URL}/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your SpendWise account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Inter, Arial, sans-serif; background: #0F0F1A; color: #E2E8F0; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #1A1A2E; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #6C63FF, #3B82F6); padding: 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; color: #fff; }
          .header p { margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
          .body { padding: 32px; }
          .body p { line-height: 1.6; color: #CBD5E1; }
          .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg, #6C63FF, #3B82F6); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
          .footer { padding: 20px 32px; text-align: center; font-size: 12px; color: #4B5563; border-top: 1px solid #2D2D44; }
          .expiry { background: #2D2D44; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #94A3B8; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 SpendWise</h1>
            <p>Smart Expense Tracking</p>
          </div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Welcome to SpendWise! Please verify your email address to activate your account and start tracking your expenses.</p>
            <div style="text-align:center">
              <a href="${link}" class="btn">✅ Verify My Email</a>
            </div>
            <div class="expiry">
              ⏱️ This link expires in <strong>24 hours</strong>. If you didn't create a SpendWise account, you can safely ignore this email.
            </div>
            <p style="margin-top:24px; font-size:13px; color:#6B7280;">Or copy this link into your browser:<br/><a href="${link}" style="color:#6C63FF; word-break:break-all;">${link}</a></p>
          </div>
          <div class="footer">© 2025 SpendWise · Built with ❤️</div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return true;
}

async function sendPasswordResetEmail(to, name, token) {
  const link = `${CLIENT_URL}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your SpendWise password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Inter, Arial, sans-serif; background: #0F0F1A; color: #E2E8F0; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #1A1A2E; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #EF4444, #F59E0B); padding: 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; color: #fff; }
          .body { padding: 32px; }
          .body p { line-height: 1.6; color: #CBD5E1; }
          .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg, #EF4444, #F59E0B); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; }
          .footer { padding: 20px 32px; text-align: center; font-size: 12px; color: #4B5563; border-top: 1px solid #2D2D44; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 SpendWise</h1>
          </div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We received a request to reset your SpendWise password. Click the button below to set a new password.</p>
            <div style="text-align:center">
              <a href="${link}" class="btn">🔑 Reset Password</a>
            </div>
            <p style="font-size:13px;color:#6B7280;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, ignore this email.</p>
          </div>
          <div class="footer">© 2025 SpendWise</div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return true;
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
