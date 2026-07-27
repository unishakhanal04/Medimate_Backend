import request from "supertest";
import app from "../../src/app";
import { UserModel } from "../../src/models/user.model";

let counter = 0;

export interface TestUser {
  token: string;
  userId: string;
  email: string;
  username: string;
}

export const registerAndLogin = async (overrides: Partial<{ username: string; email: string; password: string; gender: string }> = {}): Promise<TestUser> => {
  counter += 1;
  const email = overrides.email ?? `test-user-${counter}-${Date.now()}@example.com`;
  const username = overrides.username ?? `TestUser${counter}`;
  const password = overrides.password ?? "Password123";
  const gender = overrides.gender ?? "other";

  await request(app).post("/api/v1/auth/register").send({ username, email, gender, password });

  const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password });

  return {
    token: loginRes.body.data.token,
    userId: loginRes.body.data.user.id,
    email,
    username,
  };
};

export const makeUserAdmin = async (userId: string) => {
  await UserModel.findByIdAndUpdate(userId, { role: "admin" });
};

export const registerAndLoginAdmin = async (overrides: Partial<{ username: string; email: string; password: string }> = {}): Promise<TestUser> => {
  const user = await registerAndLogin(overrides);
  await makeUserAdmin(user.userId);

  // Re-login so the JWT payload's role claim reflects the promotion.
  const loginRes = await request(app).post("/api/v1/auth/login").send({ email: user.email, password: overrides.password ?? "Password123", portal: "admin" });

  return {
    ...user,
    token: loginRes.body.data.token,
  };
};
