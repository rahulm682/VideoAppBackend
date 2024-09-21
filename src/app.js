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

app.use("/api/users", userRouter);
app.use("/api/videos", videoRouter);
app.use("/api/tweets", tweetRouter);

export default app;
