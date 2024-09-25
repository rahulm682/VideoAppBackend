import { Router } from "express";
import {
  toggleLike,
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
} from "../controllers/like.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle-like").patch(verifyJWT, toggleLike);
router.route("/toggle-video-like/:videoId").patch(verifyJWT, toggleVideoLike);
router
  .route("/toggle-comment-like/:commentId")
  .patch(verifyJWT, toggleCommentLike);
router.route("/toggle-tweet-like/:tweetId").patch(verifyJWT, toggleTweetLike);
router.route("/all-liked-videos").get(verifyJWT, getLikedVideos);

export default router;
