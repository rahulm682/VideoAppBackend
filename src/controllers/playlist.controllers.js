import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlayList = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user = req.user?._id;

  if (!name || !description) {
    throw new ApiError(400, "name and description are required");
  }

  if (!user) {
    throw new ApiError(400, "user is invalid");
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: user,
  });

  if (!playlist) {
    throw new ApiError(500, "error in creating playlist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const { user } = req.params;

  if (!user) {
    throw new ApiError(400, "user is invalid");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user),
      },
    },
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
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $project: {
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              time: 1,
              views: 1,
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
        name: 1,
        description: 1,
        owner: 1,
        thumbnail: 1,
        videosCount: 1,
        createdAt: 1,
        updatedAt: 1,
        thumbnail: {
          $first: "$videos.thumbnail",
        },
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlist sent successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "PlaylistId is required");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
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
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
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
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          {
            $project: {
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              time: 1,
              views: 1,
              owner: 1,
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
        name: 1,
        description: 1,
        owner: 1,
        thumbnail: 1,
        videosCount: 1,
        createdAt: 1,
        updatedAt: 1,
        thumbnail: {
          $first: "$videos.thumbnail",
        },
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist sent successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  let playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlistId is not valid");
  }

  if (!userId.equals(playlist.owner)) {
    throw new ApiError(400, "user is not authorised");
  }

  playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new ApiError(500, "Error while adding video to playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAdded: true },
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  let playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlistId is not valid");
  }

  if (!userId.equals(playlist.owner)) {
    throw new ApiError(400, "user is not authorised");
  }

  playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new ApiError(500, "Error while removing video from playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSuccess: true },
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  let playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlistId is not valid");
  }

  if (!userId.equals(playlist.owner)) {
    throw new ApiError(400, "user is not authorised");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(400, "Playlist Not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = req.user?._id;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id not found");
  }

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  if (!name && !description) {
    throw new ApiError(400, "Name or description must be provided");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  if (!userId.equals(playlist.owner)) {
    throw new ApiError(400, "user is not authorised");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist._id,
    {
      name: name ? name : playlist.name,
      description: description ? description : playlist.description,
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "playlist not updated");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "playlist updated successfully")
    );
});

export {
  createPlayList,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
