import { OAuth2Client } from "google-auth-library";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";

const client = new OAuth2Client(CONSTANTS.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
}

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  if (!CONSTANTS.GOOGLE_CLIENT_ID) {
    throw new HttpException(500, "Google sign-in is not configured on the server");
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CONSTANTS.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new HttpException(401, "Invalid Google credential");
  }

  if (!payload?.email) {
    throw new HttpException(401, "Invalid Google credential");
  }

  return {
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture,
  };
};
