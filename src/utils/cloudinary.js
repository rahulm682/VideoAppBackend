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

const deleteFromCloudinary = async (mediaUrl) => {
  if (!mediaUrl) return;
  try {
    // Extract the public ID from the URL (without file extension)
    const publicId = mediaUrl.split("/").pop().split(".")[0];

    // Determine the resource type based on file extension
    const fileExtension = mediaUrl.split(".").pop();
    let resourceType = "image"; // Default to 'image'

    // If the file extension indicates a video, change resourceType
    if (["mp4", "avi", "mov", "mkv"].includes(fileExtension.toLowerCase())) {
      resourceType = "video";
    }

    // Delete the file from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(mediaUrl, result);
    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
