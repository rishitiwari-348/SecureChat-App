# 💬 SecureChat

### 🔐 Secure • Real-Time • Full-Stack Communication

**React • Node.js • Express • MongoDB • Socket.IO • JWT • Cloudinary •
WebRTC**

🌐 **Live:** https://secure-chat-app-opal.vercel.app\
📦 **GitHub:** https://github.com/rishitiwari-348/SecureChat-App
:::

------------------------------------------------------------------------

## 📌 About

**SecureChat** is a full-stack real-time communication application built
with React, Node.js, Express, MongoDB, and Socket.IO.

It provides real-time messaging, authentication, online presence, media
sharing, voice messages, group communication, and audio/video calling
through WebRTC.

### Production deployment

-   **Frontend:** Vercel
-   **Backend:** Render
-   **Database:** MongoDB Atlas
-   **Media storage:** Cloudinary

------------------------------------------------------------------------

## ✨ Features

### 💬 Messaging

-   Real-time one-to-one messaging
-   Socket.IO powered instant communication
-   Persistent messages with MongoDB
-   Online/offline presence
-   Conversation-based chat

### 👥 Communication

-   User profiles
-   Group conversations
-   Group messaging
-   Audio/video calling with WebRTC

### 🎙️ Media

-   Voice messages
-   Image sharing
-   Cloudinary media storage

### 🔐 Authentication & Security

-   JWT authentication
-   Cookie-based sessions
-   Protected API routes
-   Google OAuth
-   GitHub OAuth
-   Environment-variable based secrets
-   Arcjet API protection

### 🎨 Frontend

-   React 19
-   Vite
-   Tailwind CSS
-   DaisyUI
-   Zustand
-   React Router
-   Responsive UI
-   Toast notifications

------------------------------------------------------------------------

## 🏗️ Architecture

``` text
                         User
                           │
                           ▼
                 React + Vite Frontend
                       (Vercel)
                           │
                    HTTP / WebSocket
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Express REST API           Socket.IO
              │                  Real-Time Events
              └────────────┬────────────┘
                           ▼
                     MongoDB Atlas
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             Cloudinary           Arcjet
           Media Storage       API Protection

                    WebRTC
                       │
                       ▼
                 Audio / Video
                    Calling
```

------------------------------------------------------------------------

## 🛠️ Technology Stack

  Layer              Technology
  ------------------ ------------------------------------------
  Frontend           React 19, Vite
  Styling            Tailwind CSS, DaisyUI
  Routing            React Router
  State              Zustand
  Backend            Node.js, Express.js
  Database           MongoDB, Mongoose
  Real-Time          Socket.IO
  Authentication     JWT, Cookies, Google OAuth, GitHub OAuth
  Media              Cloudinary
  API Protection     Arcjet
  Calling            WebRTC
  Email              Resend
  Frontend Hosting   Vercel
  Backend Hosting    Render

------------------------------------------------------------------------

## 📂 Project Structure

``` text
SecureChat-App/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   MongoDB or MongoDB Atlas
-   Cloudinary account
-   Arcjet account
-   Google/GitHub OAuth credentials if OAuth is enabled

### Clone

``` bash
git clone https://github.com/rishitiwari-348/SecureChat-App.git
cd SecureChat-App
```

### Backend

``` bash
cd backend
npm install
npm run dev
```

### Frontend

Open another terminal:

``` bash
cd frontend
npm install
npm run dev
```

Frontend:

``` text
http://localhost:5173
```

Backend:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## 🔑 Environment Variables

Create `.env` files from the provided `.env.example` files.

### Backend

``` env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

NODE_ENV=development

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/oauth/github/callback
```

Email functionality, when enabled:

``` env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_sender
EMAIL_FROM_NAME=your_sender_name
```

### Frontend

``` env
VITE_API_URL=http://localhost:3000
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

**Never commit `.env` files, passwords, API keys, OAuth secrets, or
database credentials.**

------------------------------------------------------------------------

## 🌐 Production

### Frontend

https://secure-chat-app-opal.vercel.app

### Backend

https://securechat-backend-vg43.onrender.com

The production frontend communicates with the Render backend, while
MongoDB Atlas provides persistent database storage.

------------------------------------------------------------------------

## 🔒 Security

SecureChat uses:

-   JWT authentication
-   Secure cookie-based sessions
-   Protected routes
-   Google and GitHub OAuth
-   Environment variables for secrets
-   Arcjet API protection
-   Cloudinary secure media storage
-   Gitignored generated voice recordings

------------------------------------------------------------------------

## 📡 WebRTC Calling

SecureChat uses WebRTC for audio/video communication.

Optional TURN configuration:

``` env
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

A TURN server can improve connectivity for users behind restrictive NATs
or firewalls.

------------------------------------------------------------------------

## 🧪 Deployment Checklist

-   [x] React/Vite frontend deployed
-   [x] Node/Express backend deployed
-   [x] MongoDB Atlas connected
-   [x] Google OAuth configured
-   [x] GitHub OAuth configured
-   [x] Socket.IO production connection
-   [x] Cloudinary integration
-   [ ] Production email configuration
-   [ ] Optional TURN server

------------------------------------------------------------------------

## 🔮 Future Improvements

-   Message reactions
-   Read receipts
-   Typing indicators
-   Push notifications
-   Message search
-   Message editing/deletion
-   Improved WebRTC connectivity
-   End-to-end encryption
-   Advanced notification preferences

------------------------------------------------------------------------

## 🤝 Contributing

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Test the application
5.  Commit your changes
6.  Push the branch
7.  Open a Pull Request

------------------------------------------------------------------------

## 📄 License

This project is licensed under the **MIT License**.

------------------------------------------------------------------------

## 👨‍💻 Author

### Rishi Tiwari

Full-Stack Developer

-   GitHub: https://github.com/rishitiwari-348
-   LinkedIn: https://www.linkedin.com/in/rishitiwaripro/
-   Email: rishitiwaripro@gmail.com

------------------------------------------------------------------------


### ⭐ If you find SecureChat useful, consider giving the repository a star!

**Built with ❤️ by Rishi Tiwari**

