import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getAllVisibleVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/fetch-video/:videoId").get(getVideoById);
router
  .route("/update-video/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);
router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router.route("/toggle-publish/:videoId").patch(verifyJWT, togglePublishStatus);
router.route("/all-visible-videos/:userId").get(getAllVisibleVideos);
router.route("/all-videos").get(verifyJWT, getAllVideos);

export default router;
