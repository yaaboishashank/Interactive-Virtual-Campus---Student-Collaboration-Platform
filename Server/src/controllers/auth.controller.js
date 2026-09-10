import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { withMemberQueue } from "../services/roomQueue.service.js";

const AVATARS = new Set([
  "violet",
  "blue",
  "mint",
  "amber",
  "rose",
  "cyan",
]);

function serializeUser(user) {
  return {
    _id: user._id,
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: AVATARS.has(user.avatar) ? user.avatar : "violet",
    status: user.status,
  };
}

function createToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export const registerUser = async (req, res) => {
  try {
    console.log("hit")
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 50 ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a name of 2–50 characters, valid email and a password of at least 8 characters (maximum 72 UTF-8 bytes).",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      avatar: "violet",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const invalid = error.name === "ValidationError";

    if (!invalid) console.error("Registration failed:", error);

    return res.status(invalid ? 400 : 500).json({
      success: false,
      message: invalid
        ? "Please check your registration details."
        : "Unable to create account.",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(user._id),
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: serializeUser(req.user),
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    const changes = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2–50 characters.",
        });
      }

      changes.name = name.trim();
    }

    if (avatar !== undefined) {
      if (typeof avatar !== "string" || !AVATARS.has(avatar)) {
        return res.status(400).json({
          success: false,
          message: "Choose one of the available avatars.",
        });
      }

      changes.avatar = avatar;
    }

    if (!Object.keys(changes).length) {
      return res.status(400).json({
        success: false,
        message: "Provide a name or avatar to update.",
      });
    }

    const updatedUser = await withMemberQueue(
      req.user._id,
      async () => {
        const user = await User.findByIdAndUpdate(
          req.user._id,
          { $set: changes },
          { returnDocument: "after", runValidators: true }
        );

        if (user) {
          req.app.get("io")?.applyProfileUpdate?.(user);
        }

        return user;
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: serializeUser(updatedUser),
    });
  } catch (error) {
    console.error("Profile update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};