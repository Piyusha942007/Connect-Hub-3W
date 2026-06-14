# ConnectHub Social Feed

> A polished full-stack social feed clone with interactive polls, built for the **3W Full Stack Internship Task Round 1**.

ConnectHub is a responsive social media feed application built using React (Vite), Material-UI (MUI), Node, Express, and MongoDB. It focuses on clean MVC architecture, paginated feeds, real-time sync polling, and optimistic UI updates.

---

## Key Features

1. **Signup & Login**: Secure credential-based authentication using JWT stored in `localStorage` and `bcryptjs` password hashing. Input validation enforces email structure and minimum 6-character passwords.
2. **Responsive Feed Layout**: Clean grid styling using Material UI containers and grids, designed with a mobile-first approach. Fits perfectly on mobile, tablet, and desktop viewports with no horizontal scrolls.
3. **Post Creation**: Create text-only, image-only, or text + image posts. Supports interactive image previewing before submitting and file validation (MIME-type filtering and 5MB limit).
4. **Optimistic Like/Unlike**: Users can like or unlike posts, updating the counts and active states instantly on the UI. Includes automatic rollback in case of connection or API errors.
5. **Expandable Comments Section**: Interactive, collapsible comments drawer allowing authenticated users to comment. Includes custom empty states if no comments exist yet.
6. **Loading Skeletons**: Renders beautiful multi-item skeletal cards matching the exact layout of post cards to prevent layout shifts during initial feed loading.
7. **Empty States**: Friendly default banners for "No posts yet" and "No comments yet" to support edge cases.
8. **Error Boundaries**: Uses a custom React `ErrorBoundary` wrapper to handle unexpected rendering issues and allow users to reload safely.

---

## Technical Stack

* **Frontend**: React (Vite), Material UI (MUI v6), Axios, React Router (v7 style)
* **Backend**: Node.js, Express.js
* **Database**: MongoDB Atlas (with Mongoose)
* **Authentication**: JSON Web Token (JWT) with local storage hydration
* **Security & Loggers**: Helmet (securing headers), Cors, Morgan (request logging), bcryptjs (password hashing)
* **File Uploads**: Multer (configured with 5MB limits and MIME type filtering)

---

## Project Folder Structure

```
/ (Workspace Root - Frontend Vite Project)
├── package.json            # Frontend script entry and dependencies
├── vite.config.js          # Vite config (Server port 5173, Plugins)
├── index.html              # Frontend DOM mount container
├── .env.example            # Frontend environment variable template
├── src/
│   ├── api/
│   │   └── client.js       # Axios client instance with Bearer JWT interceptors
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx   # Form validation & Login input
│   │   │   └── SignupForm.jsx  # Form validation & Registration input
│   │   ├── feed/
│   │   │   ├── CreatePost.jsx  # Text & Image post creation card
│   │   │   └── FeedList.jsx    # Paginated feed manager (Skeletons & Empties)
│   │   ├── post/
│   │   │   ├── PostCard.jsx    # Memoized post component (Likes & Comments)
│   │   │   └── CommentSection.jsx # Memoized comment panel with input
│   │   └── common/
│   │       ├── Navbar.jsx      # Top responsive branding & Profile navigation
│   │       ├── ProtectedRoute.jsx # Authentication route guard
│   │       └── ErrorBoundary.jsx  # React exception fallback handler
│   ├── context/
│   │   └── AuthContext.jsx # Reusable user authentication context provider
│   ├── hooks/
│   │   └── useFeed.js      # Custom hook managing paginated feed & optimistic updates
│   ├── pages/
│   │   ├── Home.jsx        # Lazy-loaded Dashboard compose container
│   │   ├── Login.jsx       # Lazy-loaded Sign In page
│   │   └── Signup.jsx      # Lazy-loaded Sign Up page
│   ├── routes/
│   │   └── index.jsx       # App Routing configuration
│   ├── utils/
│   │   └── helpers.js      # Relative time string formatter
│   ├── services/
│   │   └── apiService.js   # Abstracted Axios operations
│   ├── theme.js            # Custom MUI theme (primary color #1976d2, shape 16px)
│   ├── index.css           # Google font imports and baseline layout reset
│   ├── App.jsx             # Top level provider wrapper
│   └── main.jsx            # Rendering entry point
│
└── backend/                # Backend API Server
    ├── package.json        # Backend dependencies & Scripts
    ├── server.js           # Express app setup, static directories, entry point
    ├── .env.example        # Backend environment variable template
    ├── uploads/            # Local directory where uploaded files are stored
    ├── config/
    │   └── db.js           # Database Mongoose Atlas connector
    ├── controllers/
    │   ├── authController.js   # Authentication controller (signup, login)
    │   └── postController.js   # Social post operations (create, get, like, comment)
    ├── middleware/
    │   ├── authMiddleware.js   # Authorization guard & Hydrating req.user
    │   ├── errorMiddleware.js  # Centralized exception handlers
    │   └── uploadMiddleware.js # Multer limits (5MB) & File filter checks
    ├── models/
    │   ├── User.js         # User Mongoose Model (email unique, indexed)
    │   └── Post.js         # Post Mongoose Model (createdAt indexed)
    └── utils/
        └── generateToken.js # JWT generation (7d expiry)
```

---

## Installation & Running Locally

### Step 1: Install Frontend (Root)
Navigate to the root directory and install dependencies:
```bash
npm install
```

### Step 2: Install Backend
Navigate to the `backend/` directory and install dependencies:
```bash
cd backend
npm install
cd ..
```

### Step 3: Set Environment Variables
Create `.env` files in both directories based on the `.env.example` templates.

* **Frontend `.env`** (placed in the root directory):
  ```env
  VITE_API_URL=http://localhost:5000
  ```
* **Backend `.env`** (placed in `backend/` directory):
  ```env
  PORT=5000
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/connecthub_social_feed?retryWrites=true&w=majority
  JWT_SECRET=supersecretjwtkey123
  CLIENT_URL=http://localhost:5173
  ```

### Step 4: Run the Application
Open two separate terminal consoles:

* **Terminal 1: Start Backend**
  ```bash
  cd backend
  npm run dev
  ```
* **Terminal 2: Start Frontend**
  ```bash
  npm run dev
  ```

The frontend will run on `http://localhost:5173` and the backend on `http://localhost:5000`.

---

## MongoDB Atlas Database Rules

The project strictly conforms to the **TWO collection rule**. There are no additional databases or collections. Mongoose schemas are defined as:

### Collection 1: `users`
* `username`: String (required)
* `email`: String (required, unique, indexed)
* `password`: String (required, hashed via bcryptjs)
* `createdAt`: Date
* `updatedAt`: Date

### Collection 2: `posts`
* `userId`: Schema.Types.ObjectId (referenced to User)
* `username`: String (required)
* `text`: String (optional)
* `image`: String (optional path to static image file)
* `likes`: Array of `{ userId, username }`
* `comments`: Array of `{ userId, username, text, createdAt }`
* `createdAt`: Date (indexed)
* `updatedAt`: Date

---

## API Documentation

All routes are prefixed with `/api`.

### 1. Authentication (`/api/auth`)

#### Register User
* **URL**: `/api/auth/signup`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "username": "Piyusha",
    "email": "piyusha@example.com",
    "password": "securepassword"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "60d0fe2c...",
      "username": "Piyusha",
      "email": "piyusha@example.com"
    }
  }
  ```

#### Login User
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "piyusha@example.com",
    "password": "securepassword"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "60d0fe2c...",
      "username": "Piyusha",
      "email": "piyusha@example.com"
    }
  }
  ```

---

### 2. Social Posts (`/api/posts`)

#### Fetch Paginated Feed
* **URL**: `/api/posts`
* **Method**: `GET`
* **Access**: Public
* **Query Parameters**:
  * `page` (number, default: `1`)
  * `limit` (number, default: `10`)
* **Success Response (200 OK)**:
  ```json
  {
    "posts": [
      {
        "_id": "60d100c8...",
        "userId": "60d0fe2c...",
        "username": "Piyusha",
        "text": "Hello World!",
        "image": "/uploads/image-1623.png",
        "likes": [],
        "comments": [],
        "createdAt": "2026-06-14T00:50:52.000Z"
      }
    ],
    "currentPage": 1,
    "hasMore": false
  }
  ```

#### Create a Post
* **URL**: `/api/posts`
* **Method**: `POST`
* **Access**: Private (JWT Bearer Token required)
* **Content-Type**: `multipart/form-data`
* **Request Payload**:
  * `text`: String (optional)
  * `image`: File (optional, JPEG/PNG/WebP, max 5MB)
* **Success Response (201 Created)**:
  ```json
  {
    "_id": "60d100c8...",
    "userId": "60d0fe2c...",
    "username": "Piyusha",
    "text": "Hello World!",
    "image": "/uploads/image-1623.png",
    "likes": [],
    "comments": [],
    "createdAt": "2026-06-14T00:50:52.000Z"
  }
  ```

#### Like / Unlike Post
* **URL**: `/api/posts/:id/like`
* **Method**: `POST`
* **Access**: Private (JWT Bearer Token required)
* **Success Response (200 OK)** (returns the updated likes array):
  ```json
  [
    {
      "userId": "60d0fe2c...",
      "username": "Piyusha"
    }
  ]
  ```

#### Comment on Post
* **URL**: `/api/posts/:id/comment`
* **Method**: `POST`
* **Access**: Private (JWT Bearer Token required)
* **Request Body**:
  ```json
  {
    "text": "This is a great comment!"
  }
  ```
* **Success Response (201 Created)** (returns the updated comments array):
  ```json
  [
    {
      "userId": "60d0fe2c...",
      "username": "Piyusha",
      "text": "This is a great comment!",
      "createdAt": "2026-06-14T00:52:10.000Z",
      "_id": "60d101d2..."
    }
  ]
  ```

---

## MongoDB Atlas Setup Guide

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new shared cluster (M0 Free Tier).
3. In the Database Access section, create a database user with Read/Write access (keep username and password handy).
4. In the Network Access section, add an entry to allow connections from anywhere (`0.0.0.0/0` - required for hosting providers like Render).
5. Navigate to Databases, select your cluster, click **Connect**, then choose **Drivers**.
6. Copy the connection string and paste it under the `MONGO_URI` variable in the backend `.env` configuration file, replacing `<username>` and `<password>` with your database user credentials.

---

## Deployment Manual

This repository is pre-configured with **Render Blueprints** (`render.yaml`) and **Vercel SPA Configs** (`vercel.json`) to make deployment seamless.

### 🖥️ Backend Deployment (Render)

You can deploy using Render's Blueprint Specification:
1. Create a free account at [Render](https://render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository containing the project. Render will automatically read the `render.yaml` and configure the web service with:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
4. Supply the required environment variables in the Render dashboard:
   * `MONGO_URI`: (Your MongoDB Atlas connection URI string)
   * `JWT_SECRET`: (Your secret token key)
   * `CLIENT_URL`: (Your Vercel URL, once generated, e.g. `https://your-app.vercel.app`)

*Note: You can also deploy manually as a Web Service using the settings in `render.yaml`.*

---

### 💻 Frontend Deployment (Vercel)

The repository includes a `vercel.json` file configuring rewrites for React Router (Single Page Application routing).
1. Create a free account at [Vercel](https://vercel.com).
2. Click **Add New** -> **Project** and import your repository.
3. In the project configure settings:
   * **Framework Preset**: `Vite` (Vercel detects this automatically)
   * **Root Directory**: (Leave blank, which compiles the main workspace)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add the environment variables:
   * `VITE_API_URL`: (Your backend Render URL, e.g. `https://xxx.onrender.com`)
5. Click **Deploy**. Vercel will build the frontend assets and host them.

---

## ⚠️ Important Security & Deployment Warnings

> [!WARNING]
> ### Render's Ephemeral Filesystem
> For simplicity and assignment compliance, uploaded image files are saved locally on disk inside the `backend/uploads/` directory using **Multer**.
>
> Render's filesystem is ephemeral. Whenever your Render service goes idle or is redeployed (which happens frequently on free tiers), any files uploaded locally on the disk will be permanently wiped out.
>
> **Production Fix**: In production apps, local disk uploads should be replaced by uploading files directly to a persistent cloud storage solution (like **Cloudinary** or **AWS S3**) and saving the remote URL inside MongoDB.
"# Connect-Hub-3W" 
