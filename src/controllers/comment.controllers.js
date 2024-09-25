import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findById(videoId);

  const allComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    // sort by date
    {
      $sort: {
        createdAt: -1,
      },
    },
    // fetch likes of Comment
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
        pipeline: [
          {
            $match: {
              liked: true,
            },
          },
          {
            $group: {
              _id: "liked",
              likedBy: { $push: "$likedBy" },
            },
          },
        ],
      },
    },
    // Reshape Likes
    {
      $addFields: {
        likes: {
          $cond: {
            if: {
              $gt: [{ $size: "$likes" }, 0],
            },
            then: { $first: "$likes.likedBy" },
            else: [],
          },
        },
      },
    },
    // get owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        isOwner: {
          $cond: {
            if: { $eq: [req.user?._id, "$owner._id"] },
            then: true,
            else: false,
          },
        },
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes"],
            },
            then: true,
            else: false,
          },
        },
        isLikedByVideoOwner: {
          $cond: {
            if: {
              $in: [video.owner, "$likes"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, allComments, "All comments Sent"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }
  if (!videoId) {
    throw new ApiError(400, "Invalid VideoId");
  }
  if (!content) {
    throw new ApiError(400, "No Comment Found");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(500, "Error while adding comment");
  }
  const { username, avatar, fullName } = req.user;

  const newComment = {
    ...comment._doc, // spread comment
    owner: { username, avatar, fullName, _id: userId },
    likesCount: 0,
    isOwner: true,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }
  if (!content) {
    throw new ApiError(400, "Content must be provided");
  }
  if (content.trim().length == 0) {
    throw new ApiError(400, "content cannot be empty");
  }

  if (!commentId) {
    throw new ApiError(400, "comment Id not provided");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: content,
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }
  if (!commentId) {
    throw new ApiError(400, "Invalid VideoId");
  }

  let comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment doesn't exists");
  }

  if (!userId.equals(comment.owner)) {
    return new ApiError(400, "user is not owner of the comments");
  }

  comment = await Comment.findByIdAndDelete(commentId);

  if (comment.deletedCount == 0) {
    throw new ApiError(500, "comment cannot be deleted due to some problem");
  }

  // delete likes associated with the comment
  await Like.deleteMany({
    comment: new mongoose.Types.ObjectId(commentId),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isDeleted: true }, "Comment deleted successfully")
    );
});

export { getAllComments, addComment, updateComment, deleteComment };
