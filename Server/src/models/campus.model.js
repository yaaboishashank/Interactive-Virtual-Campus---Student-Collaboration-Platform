import mongoose from "mongoose";

const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campus name is required"],
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      default: "",
      maxlength: 300,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Campus = mongoose.model("Campus", campusSchema);

export default Campus;