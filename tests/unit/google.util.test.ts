describe("verifyGoogleIdToken", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const mockOAuthClient = (verifyIdToken: jest.Mock) => {
    jest.doMock("google-auth-library", () => ({
      OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
    }));
  };

  const mockConstants = (clientId: string) => {
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: {
        ...jest.requireActual("../../src/config/constant").CONSTANTS,
        GOOGLE_CLIENT_ID: clientId,
      },
    }));
  };

  it("throws a 500 HttpException when GOOGLE_CLIENT_ID is not configured", async () => {
    mockOAuthClient(jest.fn());
    mockConstants("");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("token")).rejects.toMatchObject({ status: 500 });
  });

  it("throws a 401 HttpException for an invalid token", async () => {
    mockOAuthClient(jest.fn().mockRejectedValue(new Error("bad token")));
    mockConstants("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("bad")).rejects.toMatchObject({ status: 401 });
  });

  it("throws a 401 HttpException when the token has no payload", async () => {
    mockOAuthClient(jest.fn().mockResolvedValue({ getPayload: () => undefined }));
    mockConstants("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("t")).rejects.toMatchObject({ status: 401 });
  });

  it("throws a 401 HttpException when the token payload has no email", async () => {
    mockOAuthClient(
      jest.fn().mockResolvedValue({ getPayload: () => ({ name: "Jane" }) }),
    );
    mockConstants("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("t")).rejects.toMatchObject({ status: 401 });
  });

  it("uses the email prefix when Google does not provide a name", async () => {
    mockOAuthClient(
      jest.fn().mockResolvedValue({ getPayload: () => ({ email: "jane@example.com" }) }),
    );
    mockConstants("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("t")).resolves.toEqual({
      email: "jane@example.com",
      name: "jane",
      picture: undefined,
    });
  });

  it("returns the Google profile", async () => {
    mockOAuthClient(
      jest.fn().mockResolvedValue({
        getPayload: () => ({ email: "jane@example.com", name: "Jane" }),
      }),
    );
    mockConstants("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("t")).resolves.toEqual({
      email: "jane@example.com",
      name: "Jane",
      picture: undefined,
    });
  });
});
