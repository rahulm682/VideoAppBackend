import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVisibleVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "user id is required");
  }

  const allVideos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",

        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $first: "$user",
        },
      },
    },
  ]);

  // console.log(allVideos);

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "all videos fetched of user"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "user id is required");
  }

  const allVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",

        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $first: "$user",
        },
      },
    },
  ]);

  // console.log(allVideos);

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "all videos fetched of user"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const owner = req.user?._id;

  if (!owner) {
    throw new ApiError(400, "not authorised user");
  }

  if (!title || !description) {
    throw new ApiError(400, "title and description required");
  }

  const videoFilePath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0].path;

  if (!videoFilePath) {
    throw new ApiError(400, "video file is required");
  }

  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  // upload file on cloudinary
  const videoFileUpload = await uploadOnCloudinary(videoFilePath);
  const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);

  const videoFile = videoFileUpload.url;
  const thumbnail = thumbnailUpload.url;
  const time = videoFileUpload.duration;
  const views = 0;

  const video = await Video.create({
    videoFile,
    thumbnail,
    title,
    description,
    time,
    views,
    isPublished,
    owner,
  });

  if (!video) {
    throw new ApiError(500, "error in uploading video files");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "video id not found");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  if (!video.isPublished) {
    throw new ApiError(300, "video is not visible to others");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video information successfully"));
});

// in this controller we are updating all the three values
// title, description and thumbnail
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "video id not found");
  }

  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "title ans description required");
  }

  const thumbnailPath = req.file?.path;
  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail is required");
  }

  let video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const user = req.user?._id;
  if (!user) {
    throw new ApiError(400, "unauthorised access");
  }

  if (!user.equals(video.owner)) {
    throw new ApiError(400, "user is not owner of the video");
  }
  const deletedThumbnail = await deleteFromCloudinary(video?.thumbnail);
  // upload file on cloudinary
  const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
  video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnailUpload.url,
        title,
        description,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video details updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "video id not found");
  }

  let video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const user = req.user?._id;
  if (!user) {
    throw new ApiError(400, "unauthorised access");
  }

  if (!user.equals(video.owner)) {
    throw new ApiError(400, "user is not owner of the video");
  }
  const deletedVideo = await deleteFromCloudinary(video?.videoFile);
  const deletedThumbnail = await deleteFromCloudinary(video?.thumbnail);
  video = await Video.deleteOne({ _id: videoId });

  if (video.deletedCount == 0) {
    throw new ApiError(500, "video cannot be deleted due to some problem");
  }

  return res.status(200).json(new ApiResponse(200, video, "Video deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "video id not found");
  }

  let video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const user = req.user?._id;
  if (!user) {
    throw new ApiError(400, "unauthorised access");
  }

  if (!user.equals(video.owner)) {
    throw new ApiError(400, "user is not owner of the video");
  }

  video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video details updated successfully"));
});

export {
  publishVideo,
  getVideoById,
  getAllVideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVisibleVideos,
};
