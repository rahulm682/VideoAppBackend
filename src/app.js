import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

// for parsing the json data coming from request
app.use(express.json({ limit: "16kb" }));
// to encode the data from url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// to keep the static data such as files in public folder
app.use(express.static("public"));
// to use the cookies from user into server
app.use(cookieParser());

// import routers
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import healthRouter from "./routes/health.routes.js";
import playlistRouter from "./routes/playlist.routes.js";

app.use("/api/users", userRouter);
app.use("/api/videos", videoRouter);
app.use("/api/tweets", tweetRouter);
app.use("/api/likes", likeRouter);
app.use("/api/comments", commentRouter);
app.use("/api/health", healthRouter);
app.use("/api/playlist", playlistRouter);

export default app;
