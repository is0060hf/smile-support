import express from "express";
import { createServer } from "http";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contact form request body type
interface ContactFormData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
  securityAnswer: string;
  recaptchaToken?: string;
}

// Security quiz answer (Japanese: "What is the highest mountain in Japan?")
const SECURITY_ANSWER = "富士山";
const SECURITY_ANSWER_VARIANTS = ["富士山", "ふじさん", "フジサン", "fujisan", "mt.fuji", "mtfuji", "mount fuji"];

// Validate security answer
function validateSecurityAnswer(answer: string): boolean {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  return SECURITY_ANSWER_VARIANTS.some(
    (variant) => normalized === variant.toLowerCase().replace(/\s+/g, "").replace(/\./g, "")
  );
}

// Validate contact form data
function validateContactForm(data: unknown): data is ContactFormData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.name === "string" &&
    d.name.trim().length > 0 &&
    typeof d.email === "string" &&
    d.email.includes("@") &&
    typeof d.message === "string" &&
    d.message.trim().length > 0 &&
    typeof d.securityAnswer === "string"
  );
}

// Verify reCAPTCHA token with Google
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn("RECAPTCHA_SECRET_KEY not set, skipping verification");
    return true; // Skip verification if not configured
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json() as { success: boolean; "error-codes"?: string[] };
    
    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
    }
    
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

// Create Gmail transporter
function createMailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON bodies
  app.use(express.json());

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Contact form API endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate request body
      if (!validateContactForm(req.body)) {
        res.status(400).json({
          success: false,
          error: "必須項目（お名前、メールアドレス、お問い合わせ内容、セキュリティ回答）を入力してください",
        });
        return;
      }

      const { name, company, email, phone, message, securityAnswer } = req.body;

      // Validate security answer (anti-spam quiz)
      if (!validateSecurityAnswer(securityAnswer)) {
        res.status(400).json({
          success: false,
          error: "セキュリティの質問に正しくお答えください。（ヒント：日本一高い山の名前を日本語で入力してください）",
        });
        return;
      }

      // Validate reCAPTCHA token
      const recaptchaToken = req.body.recaptchaToken;
      if (!recaptchaToken) {
        res.status(400).json({
          success: false,
          error: "reCAPTCHAの認証を完了してください。",
        });
        return;
      }

      const recaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaValid) {
        res.status(400).json({
          success: false,
          error: "reCAPTCHAの認証に失敗しました。もう一度お試しください。",
        });
        return;
      }

      // Create transporter
      const transporter = createMailTransporter();
      const gmailUser = process.env.GMAIL_USER;

      // Email content
      const mailOptions = {
        from: `"すまいるサポート お問い合わせ" <${gmailUser}>`,
        to: gmailUser,
        replyTo: email,
        subject: `【お問い合わせ】${name}様より`,
        html: `
          <h2>お問い合わせがありました</h2>
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <th style="background-color: #f5f5f5; text-align: left;">お名前</th>
              <td>${escapeHtml(name)}</td>
            </tr>
            <tr>
              <th style="background-color: #f5f5f5; text-align: left;">会社名</th>
              <td>${company ? escapeHtml(company) : "（未入力）"}</td>
            </tr>
            <tr>
              <th style="background-color: #f5f5f5; text-align: left;">メールアドレス</th>
              <td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <th style="background-color: #f5f5f5; text-align: left;">電話番号</th>
              <td>${phone ? escapeHtml(phone) : "（未入力）"}</td>
            </tr>
            <tr>
              <th style="background-color: #f5f5f5; text-align: left;">お問い合わせ内容</th>
              <td style="white-space: pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            このメールはすまいるサポートのお問い合わせフォームから送信されました。
          </p>
        `,
        text: `
お問い合わせがありました

お名前: ${name}
会社名: ${company || "（未入力）"}
メールアドレス: ${email}
電話番号: ${phone || "（未入力）"}

お問い合わせ内容:
${message}
        `.trim(),
      };

      // Send notification email to admin
      await transporter.sendMail(mailOptions);

      // Send auto-reply email to the customer
      const autoReplyOptions = {
        from: `"すまいるサポート" <${gmailUser}>`,
        to: email,
        subject: "【すまいるサポート】お問い合わせを受け付けました",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D2691E;">お問い合わせありがとうございます</h2>
            <p>${escapeHtml(name)} 様</p>
            <p>
              この度は、すまいるサポートにお問い合わせいただき、誠にありがとうございます。<br>
              以下の内容でお問い合わせを受け付けました。
            </p>
            <div style="background-color: #FFF8F0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>お名前:</strong> ${escapeHtml(name)}</p>
              ${company ? `<p style="margin: 0 0 10px 0;"><strong>会社名:</strong> ${escapeHtml(company)}</p>` : ""}
              <p style="margin: 0 0 10px 0;"><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>
              ${phone ? `<p style="margin: 0 0 10px 0;"><strong>電話番号:</strong> ${escapeHtml(phone)}</p>` : ""}
              <p style="margin: 0;"><strong>お問い合わせ内容:</strong></p>
              <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <p>
              担当者より<strong>2営業日以内</strong>にご連絡いたしますので、<br>
              今しばらくお待ちくださいませ。
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              すまいるサポート<br>
              〒142-0042 東京都品川区豊町6-18-15 ミュージションテラス品川豊町<br>
              <br>
              ※このメールは自動送信されています。<br>
              ※このメールに心当たりがない場合は、お手数ですが削除してください。
            </p>
          </div>
        `,
        text: `
${name} 様

この度は、すまいるサポートにお問い合わせいただき、誠にありがとうございます。
以下の内容でお問い合わせを受け付けました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
お名前: ${name}
${company ? `会社名: ${company}\n` : ""}メールアドレス: ${email}
${phone ? `電話番号: ${phone}\n` : ""}
お問い合わせ内容:
${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

担当者より2営業日以内にご連絡いたしますので、
今しばらくお待ちくださいませ。

─────────────────────────────
すまいるサポート
〒142-0042 東京都品川区豊町6-18-15 ミュージションテラス品川豊町

※このメールは自動送信されています。
※このメールに心当たりがない場合は、お手数ですが削除してください。
        `.trim(),
      };

      await transporter.sendMail(autoReplyOptions);

      console.log(`Contact form submitted successfully from: ${email}`);

      res.status(200).json({
        success: true,
        message: "お問い合わせを受け付けました。担当者より2営業日以内にご連絡いたします。",
      });
    } catch (error) {
      console.error("Failed to send contact email:", error);

      res.status(500).json({
        success: false,
        error: "メールの送信に失敗しました。しばらく経ってから再度お試しください。",
      });
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Development: 3001 (Vite proxies /api to here), Production: 3000
  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// HTML escape helper
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

startServer().catch(console.error);
