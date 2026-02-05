import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateSecurityAnswer,
  validateContactForm,
  verifyRecaptcha,
  escapeHtml,
  sendContactEmail,
  type ContactFormData,
  type MailTransporter,
} from "./contact";

// Mock fetch for reCAPTCHA tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("validateSecurityAnswer", () => {
  it("should accept '富士山' (correct answer in kanji)", () => {
    expect(validateSecurityAnswer("富士山")).toBe(true);
  });

  it("should accept 'ふじさん' (correct answer in hiragana)", () => {
    expect(validateSecurityAnswer("ふじさん")).toBe(true);
  });

  it("should accept 'フジサン' (correct answer in katakana)", () => {
    expect(validateSecurityAnswer("フジサン")).toBe(true);
  });

  it("should accept 'fujisan' (correct answer in romaji)", () => {
    expect(validateSecurityAnswer("fujisan")).toBe(true);
  });

  it("should accept 'mt.fuji' (with dot)", () => {
    expect(validateSecurityAnswer("mt.fuji")).toBe(true);
  });

  it("should accept 'Mount Fuji' (with space and capitalization)", () => {
    expect(validateSecurityAnswer("Mount Fuji")).toBe(true);
  });

  it("should accept answer with leading/trailing whitespace", () => {
    expect(validateSecurityAnswer("  富士山  ")).toBe(true);
  });

  it("should reject incorrect answers", () => {
    expect(validateSecurityAnswer("阿蘇山")).toBe(false);
    expect(validateSecurityAnswer("エベレスト")).toBe(false);
    expect(validateSecurityAnswer("")).toBe(false);
    expect(validateSecurityAnswer("test")).toBe(false);
  });
});

describe("validateContactForm", () => {
  it("should accept valid form data with all required fields", () => {
    const validData = {
      name: "山田太郎",
      email: "test@example.com",
      message: "お問い合わせ内容です",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(validData)).toBe(true);
  });

  it("should accept form data with optional fields", () => {
    const validData = {
      name: "山田太郎",
      company: "テスト株式会社",
      email: "test@example.com",
      phone: "03-1234-5678",
      message: "お問い合わせ内容です",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(validData)).toBe(true);
  });

  it("should reject null data", () => {
    expect(validateContactForm(null)).toBe(false);
  });

  it("should reject undefined data", () => {
    expect(validateContactForm(undefined)).toBe(false);
  });

  it("should reject empty object", () => {
    expect(validateContactForm({})).toBe(false);
  });

  it("should reject when name is missing", () => {
    const data = {
      email: "test@example.com",
      message: "お問い合わせ内容です",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(data)).toBe(false);
  });

  it("should reject when name is empty", () => {
    const data = {
      name: "   ",
      email: "test@example.com",
      message: "お問い合わせ内容です",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(data)).toBe(false);
  });

  it("should reject when email is missing", () => {
    const data = {
      name: "山田太郎",
      message: "お問い合わせ内容です",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(data)).toBe(false);
  });

  it("should reject when email has no @ symbol", () => {
    const data = {
      name: "山田太郎",
      email: "invalid-email",
      message: "お問い合わせ内容です",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(data)).toBe(false);
  });

  it("should reject when message is missing", () => {
    const data = {
      name: "山田太郎",
      email: "test@example.com",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(data)).toBe(false);
  });

  it("should reject when message is empty", () => {
    const data = {
      name: "山田太郎",
      email: "test@example.com",
      message: "   ",
      securityAnswer: "富士山",
    };
    expect(validateContactForm(data)).toBe(false);
  });

  it("should reject when securityAnswer is missing", () => {
    const data = {
      name: "山田太郎",
      email: "test@example.com",
      message: "お問い合わせ内容です",
    };
    expect(validateContactForm(data)).toBe(false);
  });
});

describe("verifyRecaptcha", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should return true when secret key is not provided", async () => {
    const result = await verifyRecaptcha("test-token");
    expect(result).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return true when verification succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    const result = await verifyRecaptcha("valid-token", "secret-key");
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );
  });

  it("should return false when verification fails", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: false,
          "error-codes": ["invalid-input-response"],
        }),
    });

    const result = await verifyRecaptcha("invalid-token", "secret-key");
    expect(result).toBe(false);
  });

  it("should return false when fetch throws an error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await verifyRecaptcha("test-token", "secret-key");
    expect(result).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("should escape ampersand", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("should escape less than sign", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("should escape greater than sign", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("should escape multiple special characters", () => {
    expect(escapeHtml('<a href="test">link</a>')).toBe(
      "&lt;a href=&quot;test&quot;&gt;link&lt;/a&gt;"
    );
  });

  it("should return empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("should not modify text without special characters", () => {
    expect(escapeHtml("Hello World 日本語")).toBe("Hello World 日本語");
  });
});

describe("sendContactEmail", () => {
  const mockSendMail = vi.fn();
  const mockTransporter = {
    sendMail: mockSendMail,
  } as unknown as MailTransporter;

  const validFormData: ContactFormData = {
    name: "山田太郎",
    company: "テスト株式会社",
    email: "customer@example.com",
    phone: "03-1234-5678",
    message: "お問い合わせ内容です",
    securityAnswer: "富士山",
  };

  beforeEach(() => {
    mockSendMail.mockReset();
  });

  it("should send both notification and auto-reply emails on success", async () => {
    mockSendMail.mockResolvedValue({});

    const result = await sendContactEmail(
      validFormData,
      mockTransporter,
      "admin@example.com"
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("お問い合わせを受け付けました");
    expect(mockSendMail).toHaveBeenCalledTimes(2);

    // Check notification email
    const notificationCall = mockSendMail.mock.calls[0][0];
    expect(notificationCall.to).toBe("admin@example.com");
    expect(notificationCall.replyTo).toBe("customer@example.com");
    expect(notificationCall.subject).toContain("山田太郎");

    // Check auto-reply email
    const autoReplyCall = mockSendMail.mock.calls[1][0];
    expect(autoReplyCall.to).toBe("customer@example.com");
    expect(autoReplyCall.subject).toContain("お問い合わせを受け付けました");
  });

  it("should return error when sendMail fails", async () => {
    mockSendMail.mockRejectedValue(new Error("SMTP error"));

    const result = await sendContactEmail(
      validFormData,
      mockTransporter,
      "admin@example.com"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("メールの送信に失敗しました");
  });

  it("should handle form data without optional fields", async () => {
    mockSendMail.mockResolvedValue({});

    const minimalFormData: ContactFormData = {
      name: "田中花子",
      email: "hanako@example.com",
      message: "テストメッセージ",
      securityAnswer: "富士山",
    };

    const result = await sendContactEmail(
      minimalFormData,
      mockTransporter,
      "admin@example.com"
    );

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it("should escape HTML in email content", async () => {
    mockSendMail.mockResolvedValue({});

    const xssFormData: ContactFormData = {
      name: "<script>alert('xss')</script>",
      email: "test@example.com",
      message: "<img src=x onerror=alert(1)>",
      securityAnswer: "富士山",
    };

    await sendContactEmail(xssFormData, mockTransporter, "admin@example.com");

    const notificationCall = mockSendMail.mock.calls[0][0];
    expect(notificationCall.html).toContain("&lt;script&gt;");
    expect(notificationCall.html).not.toContain("<script>");
  });
});
