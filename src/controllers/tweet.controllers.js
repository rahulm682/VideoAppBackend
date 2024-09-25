import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "user not authorised");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });

  if (!tweet) {
    throw new ApiError(500, tweet, "tweet cannot be created");
  }

  let newTweet = {
    ...tweet._doc,
    owner: {
      fullName: req.user?.fullName,
      username: req.user?.username,
      avatar: req.user?.avatar,
    },
    totalLikes: 0,
    isLiked: false,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "user not authorised");
  }

  const allTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    // sort by latest
    {
      $sort: {
        createdAt: -1,
      },
    },
    //fetch likes for the tweet
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
        pipeline: [
          {
            $match: {
              liked: true,
            },
          },
          {
            $group: {
              _id: "$liked",
              owners: { $push: "$likedBy" },
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
            then: { $first: "$likes.owners" },
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
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        totalLikes: {
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
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, allTweets, "tweets retrieved successfully"));
});

const getAnyUserTweets = asyncHandler(async (req, res) => {
  let userid = req.user?._id;
  if (!userid) {
    throw new ApiError(400, "user not authorised");
  }

  const { userId } = req.params;

  const allTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    // sort by latest
    {
      $sort: {
        createdAt: -1,
      },
    },
    //fetch likes for the tweet
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
        pipeline: [
          {
            $match: {
              liked: true,
            },
          },
          {
            $group: {
              _id: "$liked",
              owner: { $push: "$likedBy" },
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
            then: { $first: "$likes.owners" },
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
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        totalLikes: {
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
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, allTweets, "tweets retrieved successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "valid user required");
  }

  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "invalid tweet id");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content not found");
  }

  let tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "tweet not found");
  }

  if (!userId.equals(tweet.owner)) {
    throw new ApiError(400, "user not valid");
  }

  tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!tweet) {
    throw new ApiError(500, "tweet cannot be updated due to some problem");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "valid user required");
  }

  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "invalid tweet id");
  }

  let tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "tweet not found");
  }

  if (!userId.equals(tweet.owner)) {
    throw new ApiError(400, "user not authorised");
  }

  tweet = await Tweet.findByIdAndDelete(tweetId);

  if (tweet.deletedCount == 0) {
    throw new ApiError(500, "tweet cannot be deleted due to some problem");
  }

  await Like.deleteMany({
    tweet: new mongoose.Types.ObjectId(tweetId),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet deleted successfully"));
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
  getAnyUserTweets,
};
