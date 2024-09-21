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

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
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

  tweet = await Tweet.deleteOne({ _id: tweetId });

  if (tweet.deletedCount == 0) {
    throw new ApiError(500, "tweet cannot be deleted due to some problem");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
