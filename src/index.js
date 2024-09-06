import connectDB from "./db/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.log("Error", err);
    })
    
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App started on port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("connection to mongoDB failed", err);
})