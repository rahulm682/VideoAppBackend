import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const toggleLike = asyncHandler(async (req, res) => {
  const { commentId, videoId, tweetId } = req.query;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }

  if (!commentId && !tweetId && !videoId) {
    throw new ApiError(400, "Invalid id");
  }

  let userLike;

  if (commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(400, "No comment found");
    }

    userLike = await Like.find({
      comment: commentId,
      likedBy: userId,
    });
  } else if (videoId) {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(400, "No video found");
    }

    userLike = await Like.find({
      video: videoId,
      likedBy: userId,
    });
  } else if (tweetId) {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(400, "No tweet found");
    }

    userLike = await Like.find({
      tweet: tweetId,
      likedBy: userId,
    });
  }

  if (userLike?.length > 0) {
    // entry is present so toggle status
    userLike[0].liked = !userLike[0].liked;
    let res = await userLike[0].save();
    if (!res) {
      throw new ApiError(500, "error while updating like");
    }
  } else {
    // entry is not present so create new
    if (commentId) {
      userLike = await Like.create({
        comment: commentId,
        likedBy: userId,
        liked: true,
      });
    } else if (videoId) {
      userLike = await Like.create({
        video: videoId,
        likedBy: userId,
        liked: true,
      });
    } else if (tweetId) {
      userLike = await Like.create({
        tweet: tweetId,
        likedBy: userId,
        liked: true,
      });
    }
    if (!userLike) {
      throw new ApiError(500, "error while toggling like");
    }
  }

  let totalLikes;

  if (commentId) {
    totalLikes = await Like.find({ comment: commentId, liked: true });
  } else if (videoId) {
    totalLikes = await Like.find({ video: videoId, liked: true });
  } else if (tweetId) {
    totalLikes = await Like.find({ tweet: tweetId, liked: true });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userLike,
        totalLikes: totalLikes.length,
      },
      "Like toggled successfully"
    )
  );
});

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }

  if (!videoId) {
    throw new ApiError(400, "invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  let like = await Like.find({ video: videoId, likedBy: userId });

  if (like && like.length > 0) {
    like[0].liked = !like[0].liked;
    like = await like[0].save();
    if (!like) {
      throw new ApiError(500, "error while toggling like");
    }
  } else {
    like = await Like.create({ video: videoId, likedBy: userId });
    if (!like) {
      throw new ApiError(500, "error while toggling like");
    }
  }

  let totalLikes = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        liked: true,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { like, totalLikes: totalLikes.length },
        "video like toggled successfully"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }

  if (!commentId) {
    throw new ApiError(400, "invalid commentId");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "no comment found");
  }

  let userLike = await Like.find({
    comment: commentId,
    likedBy: userId,
  });

  if (userLike?.length > 0) {
    // entry is present so toggle status
    userLike[0].liked = !userLike[0].liked;
    let res = await userLike[0].save();
    if (!res) {
      throw new ApiError(500, "error while updating like");
    }
  } else {
    // entry is not present so create new
    userLike = await Like.create({
      comment: commentId,
      likedBy: userId,
      liked: true,
    });
    if (!userLike) {
      throw new ApiError(500, "error while toggling like");
    }
  }

  let totalLikes = await Like.find({ comment: commentId, liked: true });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userLike,
        totalLikes: totalLikes.length,
      },
      "Comment like toggled successfully"
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }
  if (!tweetId) {
    throw new ApiError(400, "invalid tweetId");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "no tweet found");
  }
  let userLike = await Like.find({ tweet: tweetId, likedBy: userId });

  if (userLike?.length > 0) {
    userLike[0].liked = !userLike[0].like;
    let res = await userLike[0].save();
    if (!res) {
      throw new ApiError(500, "error while updating like");
    }
  } else {
    userLike = await Like.create({ tweet: tweetId, likedBy: userId });
    if (!userLike) {
      throw new ApiError(500, "error while toggling like");
    }
  }

  let totalLikes = await Like.find({ tweet: tweetId, liked: true });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userLike, totalLikes: totalLikes.length },
        "Tweet like toggled successfully"
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid user");
  }
  const likedVideos = await Like.aggregate([
    {
      $match: {
        video: { $ne: null },
        likedBy: new mongoose.Types.ObjectId(userId),
        liked: true,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $unwind: "$video",
    },
    {
      $match: {
        "video.isPublished": true,
      },
    },
    {
      $group: {
        _id: "likedBy",
        videos: { $push: "$video" },
      },
    },
  ]);

  const videos = likedVideos[0]?.videos || [];

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "videos sent successfully"));
});

export {
  toggleLike,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
