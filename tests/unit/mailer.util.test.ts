describe("mailer.util", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("verifySmtpConnection returns false when SMTP_HOST is not configured", async () => {
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: { ...jest.requireActual("../../src/config/constant").CONSTANTS, SMTP_HOST: "" },
    }));
    const { verifySmtpConnection } = require("../../src/utils/mailer.util");
    await expect(verifySmtpConnection()).resolves.toBe(false);
  });

  it("sendMail throws when SMTP_HOST is not configured", async () => {
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: { ...jest.requireActual("../../src/config/constant").CONSTANTS, SMTP_HOST: "" },
    }));
    const { sendMail } = require("../../src/utils/mailer.util");
    await expect(sendMail("a@b.com", "Subject", "<p>hi</p>")).rejects.toThrow(/SMTP is not configured/);
  });

  it("verifySmtpConnection calls transporter.verify and returns true when configured", async () => {
    const verifyMock = jest.fn().mockResolvedValue(true);
    jest.doMock("nodemailer", () => ({
      createTransport: jest.fn(() => ({ verify: verifyMock, sendMail: jest.fn() })),
    }));
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: { ...jest.requireActual("../../src/config/constant").CONSTANTS, SMTP_HOST: "smtp.test.com", SMTP_PORT: 587 },
    }));
    const { verifySmtpConnection } = require("../../src/utils/mailer.util");
    await expect(verifySmtpConnection()).resolves.toBe(true);
    expect(verifyMock).toHaveBeenCalled();
  });

  it("sendMail calls transporter.sendMail with the from/to/subject/html fields", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "1" });
    jest.doMock("nodemailer", () => ({
      createTransport: jest.fn(() => ({ verify: jest.fn(), sendMail: sendMailMock })),
    }));
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: {
        ...jest.requireActual("../../src/config/constant").CONSTANTS,
        SMTP_HOST: "smtp.test.com",
        SMTP_FROM: "Test <no-reply@test.com>",
      },
    }));
    const { sendMail } = require("../../src/utils/mailer.util");
    await sendMail("to@test.com", "Hello", "<p>Body</p>");
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "Test <no-reply@test.com>",
      to: "to@test.com",
      subject: "Hello",
      html: "<p>Body</p>",
    });
  });

  it("verifySmtpConnection propagates a transporter verification error", async () => {
    jest.doMock("nodemailer", () => ({
      createTransport: jest.fn(() => ({ verify: jest.fn().mockRejectedValue(new Error("boom")), sendMail: jest.fn() })),
    }));
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: { ...jest.requireActual("../../src/config/constant").CONSTANTS, SMTP_HOST: "smtp.test.com" },
    }));
    const { verifySmtpConnection } = require("../../src/utils/mailer.util");
    await expect(verifySmtpConnection()).rejects.toThrow("boom");
  });

  it("configures the transporter as secure when SMTP_PORT is 465", async () => {
    const createTransportMock = jest.fn(() => ({ verify: jest.fn().mockResolvedValue(true), sendMail: jest.fn() }));
    jest.doMock("nodemailer", () => ({ createTransport: createTransportMock }));
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: { ...jest.requireActual("../../src/config/constant").CONSTANTS, SMTP_HOST: "smtp.test.com", SMTP_PORT: 465 },
    }));
    const { verifySmtpConnection } = require("../../src/utils/mailer.util");
    await verifySmtpConnection();
    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
  });
});
