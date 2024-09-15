import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // upload files from request through multer in local folders
  // the name fields is used to determine the name of uploaded files that can be accessed in controller function
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// routes requiring verification
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreh-token").post(refreshAccessToken);

export default router;
