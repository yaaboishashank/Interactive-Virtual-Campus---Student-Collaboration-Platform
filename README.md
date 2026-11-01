# CampusVerse 🎓

**A real-time virtual campus where students can meet, communicate, and explore shared spaces together.**

[Live Demo](https://campus-verse-your.vercel.app) · [Backend Status](https://campusverse-server-my.onrender.com/api/health)

## About

CampusVerse is a full-stack virtual campus platform built to make online student interaction more engaging.

Users can create or join campuses, enter different rooms, communicate through real-time chat, and move their avatars inside a shared interactive environment.

This project helped me understand how authentication, REST APIs, databases, permissions, real-time communication, and interactive interfaces work together in a complete application.

## Features

- User registration and login
- JWT-based authentication
- Create and join campuses using invite codes
- Create classrooms, libraries, lounges, and study rooms
- Edit, delete, lock, and manage rooms
- Real-time room chat
- Online user presence
- Multiplayer avatar movement
- Interactive campus map
- Persistent message history
- Light and dark themes
- Responsive user interface
- Multi-user room update and deletion events

## Tech Stack

### Frontend

- React.js
- Vite
- React Router
- CSS Modules
- GSAP
- Phaser

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcrypt

### Deployment

- Vercel
- Render
- MongoDB Atlas

## How It Works

1. A user creates an account or logs in.
2. The user creates a campus or joins one using an invite code.
3. Campus members can create and enter shared rooms.
4. REST APIs manage users, campuses, rooms, and saved messages.
5. Socket.IO synchronizes chat, presence, movement, and room events.
6. The interactive map displays connected users as moving avatars.

## Project Structure

```text
CampusVerse/
├── Client/     # React frontend
├── Server/     # Node and Express backend
└── README.md
```

## What I Learned

CampusVerse was more than a CRUD project for me. While building it, I learned:

- How to design a complete full-stack application
- How JWT authentication and protected routes work
- How to manage relationships between MongoDB documents
- How to implement permissions for owners and members
- How to build real-time features using Socket.IO
- How to synchronize multiple users inside a shared environment
- How to handle loading, error, and disconnected states
- How to debug CORS and environment-variable issues
- How to deploy and connect separate frontend and backend applications

The most important lesson was that building a feature is only the beginning. Handling multiple users, permissions, failed connections, cleanup, and edge cases is what makes an application reliable.

## Run Locally

Clone the repository:

```bash
git clone https://github.com/yaaboishashank/CampusVerse_Your.git
cd CampusVerse_Your
```

Install and run the backend:

```bash
cd Server
npm install
npm run dev
```

Open another terminal and run the frontend:

```bash
cd Client
npm install
npm run dev
```

Add the required environment variables inside the `Client` and `Server` folders before starting the application.

## Current Status

CampusVerse is deployed and functional. I am continuing to improve its performance, accessibility, responsiveness, and real-time experience as I learn more.

## Author

**Shashank Sharma**

Full-Stack Developer · MCA Student

---

If you found this project interesting, consider giving the repository a ⭐
