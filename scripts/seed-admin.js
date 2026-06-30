require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medimate";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@medimate.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "System Admin").trim();
const ADMIN_GENDER = process.env.ADMIN_GENDER || "other";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  if (ADMIN_PASSWORD.trim().length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters");
  }

  await mongoose.connect(MONGO_URI);

  const existingUser = await User.findOne({ email: ADMIN_EMAIL });

  if (existingUser) {
    existingUser.username = ADMIN_USERNAME;
    existingUser.gender = ADMIN_GENDER;
    existingUser.role = "admin";
    existingUser.status = "active";
    existingUser.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await existingUser.save();

    console.log(`Promoted existing user to admin: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      gender: ADMIN_GENDER,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      profileImage: null,
      role: "admin",
      status: "active",
    });

    console.log(`Created new admin user: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
}

seedAdmin()
  .then(() => {
    console.log("Admin seeding complete");
  })
  .catch(async (error) => {
    console.error("Failed to seed admin:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
