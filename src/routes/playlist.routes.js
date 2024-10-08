import { Router } from "express";
import {
  createPlayList,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/create-playlist").post(createPlayList);
router.route("/get-user-playlist/:user").get(getUserPlaylist);
router.route("/get-playlist/:playlistId").get(getPlaylistById);

router.route("/add-video/:videoId/:playlistId").patch(addVideoToPlaylist);
router
  .route("/remove-video/:videoId/:playlistId")
  .patch(removeVideoFromPlaylist);

router.route("/update-playlist/:playlistId").patch(updatePlaylist);
router.route("/delete-playlist/:playlistId").delete(deletePlaylist);

export default router;
