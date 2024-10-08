# Video Streaming Application (Backend)

This project is a backend application for a video streaming platform that includes user authentication, video uploads, commenting, tweeting, and interaction features like liking and disliking videos, comments, and tweets.

## Features

### User Authentication:

Users can sign up and log in.
Passwords are securely hashed using bcrypt.
Stateless authentication using JWT (JSON Web Tokens).

### Video Uploading:

Users can upload videos using Multer for file handling.
Videos are stored in Cloudinary, a cloud-based service for managing videos and images.

### Comments and Tweets:

Users can post comments on videos and create tweets.
Comments and tweets can be liked by other users.

### Likes and Dislikes:

Users can like/dislike videos, comments, and tweets.

## Tech Stack and Tools

### Node.js: JavaScript runtime environment for server-side development.

### Express.js: Web framework for building REST APIs.

### MongoDB: NoSQL database used to store data like users, videos, comments, tweets, and likes/dislikes.

### Mongoose: ODM (Object Data Modeling) library for MongoDB, enabling schema creation and database operations.

### JWT (JSON Web Token): Used for secure user authentication and session management.

### bcrypt: Library for hashing and verifying passwords securely.

### Multer: Middleware for handling multipart/form-data, primarily used for file uploads.

### Cloudinary: Cloud storage service for video and image file storage and management.

### Postman: Used Postman to test the API endpoints.
