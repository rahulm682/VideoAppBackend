import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file uploaded succesfully
    console.log("uploaded on cloudinary", uploadResult.url);
    // unlink file from local storage
    fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    // in case of error
    // unlink file from local storage
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
