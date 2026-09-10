import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    description: {
      type: String,
      default: "",
      maxlength: 200,
    },

    type: {
      type: String,
      enum: ["classroom", "library", "lounge", "meeting", "study"],
      default: "study",
    },

    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    capacity: {
      type: Number,
      default: 20,
      min: 2,
      max: 100,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;