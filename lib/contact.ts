import nodemailer from "nodemailer";

// Contact form request body type
export interface ContactFormData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
  securityAnswer: string;
  recaptchaToken?: string;
}

// Security quiz answer variants (Japanese: "What is the highest mountain in Japan?")
const SECURITY_ANSWER_VARIANTS = [
  "富士山",
  "ふじさん",
  "フジサン",
  "fujisan",
  "mt.fuji",
  "mtfuji",
  "mount fuji",
];

/**
 * Validate security answer for anti-spam quiz
 * @param answer - User's answer to the security question
 * @returns true if the answer is correct
 */
export function validateSecurityAnswer(answer: string): boolean {
  const normalized = answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "");
  return SECURITY_ANSWER_VARIANTS.some(
    (variant) =>
      normalized === variant.toLowerCase().replace(/\s+/g, "").replace(/\./g, "")
  );
}

/**
 * Validate contact form data
 * @param data - Form data to validate
 * @returns true if the data is valid
 */
export function validateContactForm(data: unknown): data is ContactFormData {
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

// reCAPTCHA verification response type
interface RecaptchaResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verify reCAPTCHA token with Google
 * @param token - reCAPTCHA token from client
 * @param secretKey - reCAPTCHA secret key (optional, skips verification if not provided)
 * @returns true if verification succeeded or was skipped
 */
export async function verifyRecaptcha(
  token: string,
  secretKey?: string
): Promise<boolean> {
  if (!secretKey) {
    console.warn("RECAPTCHA_SECRET_KEY not set, skipping verification");
    return true;
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = (await response.json()) as RecaptchaResponse;

    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
    }

    return data.success;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

/**
 * HTML escape helper
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

// Email transporter type
export type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

/**
 * Create Gmail transporter
 * @param gmailUser - Gmail address
 * @param gmailAppPassword - Gmail app password
 * @returns Nodemailer transporter
 */
export function createMailTransporter(
  gmailUser: string,
  gmailAppPassword: string
): MailTransporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

// Contact email result type
export interface SendContactEmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send contact form emails (notification to admin + auto-reply to customer)
 * @param formData - Contact form data
 * @param transporter - Nodemailer transporter
 * @param gmailUser - Gmail address (used as from/to)
 * @returns Result object with success status
 */
export async function sendContactEmail(
  formData: ContactFormData,
  transporter: MailTransporter,
  gmailUser: string
): Promise<SendContactEmailResult> {
  const { name, company, email, phone, message } = formData;

  try {
    // Admin notification email
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

    await transporter.sendMail(mailOptions);

    // Auto-reply email to customer
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

    return {
      success: true,
      message: "お問い合わせを受け付けました。担当者より2営業日以内にご連絡いたします。",
    };
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return {
      success: false,
      error: "メールの送信に失敗しました。しばらく経ってから再度お試しください。",
    };
  }
}
