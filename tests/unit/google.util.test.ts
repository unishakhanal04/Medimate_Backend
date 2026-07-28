describe("verifyGoogleIdToken", () => {
  afterEach(() => {
    jest.resetModules();
  });

  const mockOAuthClient = (verifyIdToken: jest.Mock) => {
    jest.doMock("google-auth-library", () => ({
      OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
    }));
  };

  const mockClientId = (clientId: string) => {
    jest.doMock("../../src/config/constant", () => ({
      CONSTANTS: { ...jest.requireActual("../../src/config/constant").CONSTANTS, GOOGLE_CLIENT_ID: clientId },
    }));
  };

  it("throws a 500 HttpException when GOOGLE_CLIENT_ID is not configured", async () => {
    mockOAuthClient(jest.fn());
    mockClientId("");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("token")).rejects.toMatchObject({ status: 500 });
  });

  it("throws a 401 HttpException when the token fails verification", async () => {
    mockOAuthClient(jest.fn().mockRejectedValue(new Error("bad token")));
    mockClientId("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("bad")).rejects.toMatchObject({ status: 401 });
  });

  it("throws a 401 HttpException when the payload has no email", async () => {
    mockOAuthClient(jest.fn().mockResolvedValue({ getPayload: () => ({ name: "Jane" }) }));
    mockClientId("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    await expect(verifyGoogleIdToken("t")).rejects.toMatchObject({ status: 401 });
  });

  it("returns the profile from a valid payload", async () => {
    mockOAuthClient(
      jest.fn().mockResolvedValue({
        getPayload: () => ({ email: "jane@example.com", name: "Jane Doe", picture: "http://pic" }),
      })
    );
    mockClientId("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    const profile = await verifyGoogleIdToken("t");
    expect(profile).toEqual({ email: "jane@example.com", name: "Jane Doe", picture: "http://pic" });
  });

  it("derives the display name from the email local-part when the payload has no name", async () => {
    mockOAuthClient(jest.fn().mockResolvedValue({ getPayload: () => ({ email: "jane@example.com" }) }));
    mockClientId("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    const profile = await verifyGoogleIdToken("t");
    expect(profile.name).toBe("jane");
  });

  it("leaves picture undefined when the payload has none", async () => {
    mockOAuthClient(jest.fn().mockResolvedValue({ getPayload: () => ({ email: "jane@example.com", name: "Jane" }) }));
    mockClientId("client-id");
    const { verifyGoogleIdToken } = require("../../src/utils/google.util");
    const profile = await verifyGoogleIdToken("t");
    expect(profile.picture).toBeUndefined();
  });
});
