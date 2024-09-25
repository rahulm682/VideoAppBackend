import { Router } from "express";
import {
  addComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/get-all-comments/:videoId").get(verifyJWT, getAllComments);
router.route("/add-comment/:videoId").get(verifyJWT, addComment);
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

router.route("/update-comment/:commentId").patch(verifyJWT, updateComment);

export default router;
