import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: "Tweet",
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Like = mongoose.Schema("Like", likeSchema);
