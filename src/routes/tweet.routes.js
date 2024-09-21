import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getAnyUserTweets,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controllers.js";

const router = Router();

router.route("/create-tweet").post(verifyJWT, createTweet);
router.route("/get-user-tweets").get(verifyJWT, getUserTweets);
router.route("/get-any-user-tweets/:userId").get(verifyJWT, getAnyUserTweets);
router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet);
router.route("/delete-tweet/:tweetId").delete(verifyJWT, deleteTweet);

export default router;
