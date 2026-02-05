import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  validateContactForm,
  validateSecurityAnswer,
  verifyRecaptcha,
  createMailTransporter,
  sendContactEmail,
} from "../lib/contact";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST method
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Validate request body
  const body = req.body;
  if (!validateContactForm(body)) {
    res.status(400).json({
      error: "入力内容に不備があります。必須項目をすべて入力してください。",
    });
    return;
  }

  // Validate security answer (anti-spam quiz)
  if (!validateSecurityAnswer(body.securityAnswer)) {
    res.status(400).json({
      error:
        "セキュリティ確認の回答が正しくありません。日本で一番高い山の名前を入力してください。",
    });
    return;
  }

  // Verify reCAPTCHA token
  const recaptchaToken = body.recaptchaToken;
  if (!recaptchaToken) {
    res.status(400).json({
      error: "reCAPTCHA認証を完了してください。",
    });
    return;
  }

  const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
  const isRecaptchaValid = await verifyRecaptcha(
    recaptchaToken,
    recaptchaSecretKey
  );

  if (!isRecaptchaValid) {
    res.status(400).json({
      error: "reCAPTCHA認証に失敗しました。再度お試しください。",
    });
    return;
  }

  // Prepare email sending
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error("GMAIL_USER or GMAIL_APP_PASSWORD not configured");
    res.status(500).json({
      error: "サーバーの設定に問題があります。管理者にお問い合わせください。",
    });
    return;
  }

  // Create transporter and send emails
  const transporter = createMailTransporter(gmailUser, gmailAppPassword);
  const result = await sendContactEmail(body, transporter, gmailUser);

  if (result.success) {
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } else {
    res.status(500).json({
      error: result.error,
    });
  }
}
