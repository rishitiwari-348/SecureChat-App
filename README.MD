<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=250&color=gradient&customColorList=12,20,24,30&text=SecureChat&fontAlignY=38&fontSize=56&desc=Production-Ready%20Real-Time%20Messaging%20Platform&descAlignY=58"/>

# 💬 SecureChat

### Secure • Fast • Real-Time Communication

<p>

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react"/>

<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite"/>

<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js"/>

<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express"/>

<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb"/>

<img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio"/>

<img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens"/>

<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary"/>

<img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss"/>

</p>

</div>

---

# 🚀 Overview

SecureChat is a production-ready full-stack real-time messaging platform built with **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.

The application provides secure JWT authentication, real-time messaging, online presence detection, cloud-based image sharing, welcome email automation, and a modern responsive interface designed with scalability and clean architecture in mind.

It demonstrates the technologies commonly used to build modern messaging applications and emphasizes security, performance, and user experience.

---

# ✨ Key Features

- 💬 Real-Time Messaging
- 🔐 JWT Authentication
- 🟢 Online / Offline Presence
- 🖼️ Image Sharing with Cloudinary
- 📧 Welcome Emails with Resend
- 🛡️ Arcjet API Protection
- 📱 Fully Responsive UI
- ⚡ Fast React + Vite Frontend
- 🌙 Modern Tailwind CSS + DaisyUI Design
- 🧠 Zustand State Management
- 🚀 RESTful API Architecture
- ☁️ MongoDB Data Persistence

---
# 🏗️ System Architecture

```text
                    User
                      │
                      ▼
            React + Vite Frontend
                      │
                 Axios Requests
                      │
      ┌───────────────┴───────────────┐
      ▼                               ▼
 REST API (Express.js)          Socket.IO Server
      │                               │
 JWT Authentication          Real-Time Communication
      │                               │
      └───────────────┬───────────────┘
                      ▼
                 MongoDB Database
                      │
      ┌───────────────┼────────────────┐
      ▼               ▼                ▼
 Cloudinary      Resend Email      Arcjet Security
```

---

# ⚡ Real-Time Messaging Flow

```text
User Login
     │
     ▼
JWT Authentication
     │
     ▼
Socket Connection
     │
     ▼
Send Message
     │
     ▼
Socket.IO Event
     │
     ▼
Receiver Online?
     │
 ┌───┴────┐
 │        │
Yes       No
 │        │
 ▼        ▼
Instant   Store in MongoDB
Delivery       │
 │             ▼
 ▼       Deliver When Online
```

---

# 🔒 Security Features

- 🔐 JWT Authentication
- 🍪 Secure Cookie-based Sessions
- 🛡️ Arcjet API Protection
- 🔑 Environment Variables
- ☁️ Cloudinary Secure Uploads
- ✅ Request Validation
- 🚫 Unauthorized Route Protection

---

# ⚙️ Technology Stack

| Layer | Technologies |
|--------|--------------|
| Frontend | React, Vite, Tailwind CSS, DaisyUI |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + Cookies |
| Real-Time | Socket.IO |
| Image Storage | Cloudinary |
| Email Service | Resend |
| State Management | Zustand |

---

# 📂 Project Structure

```text
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
│   │
│   └── test/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
│   │
│   └── public/
│
└── README.md
```

---
# 🚀 Getting Started

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+
- MongoDB
- Cloudinary Account
- Resend API Key
- Arcjet API Key

---

## Clone the Repository

```bash
git clone https://github.com/Rahul-Baghel01/SecureChat-App.git
```

---

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## Start the Backend

```bash
npm run dev
```

---

## Start the Frontend

```bash
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the **backend** folder.

```env
PORT=
MONGO_URI=
JWT_SECRET=

CLIENT_URL=

RESEND_API_KEY=
EMAIL_FROM=
EMAIL_FROM_NAME=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

ARCJET_KEY=
ARCJET_ENV=
```

> **Important:** Never commit your `.env` file or API keys to GitHub.

---

# 📷 Screenshots

## Login Page

> Add `login.png`

---

## Chat Dashboard

> Add `dashboard.png`

---

## Real-Time Messaging

> Add `chat.png`

---

## Profile & Settings

> Add `profile.png`

---

# 📈 Future Roadmap

- [x] JWT Authentication
- [x] Real-Time Messaging
- [x] Online Presence
- [x] Cloudinary Image Upload
- [x] Welcome Email
- [x] Responsive UI
- [ ] Message Reactions
- [ ] Voice Messages
- [ ] Group Chats
- [ ] Video Calling
- [ ] Push Notifications
- [ ] End-to-End Encryption

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 🛡️ License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

## Rahul Baghel

AI & Full Stack Developer

- GitHub: https://github.com/Rahul-Baghel01
- LinkedIn: https://www.linkedin.com/in/rahul-baghel-6694a9343/
- Email: rahulorai03@gmail.com

---

<div align="center">

## ⭐ If you like this project, please give it a Star!

### Built with ❤️ by Rahul Baghel

</div>
