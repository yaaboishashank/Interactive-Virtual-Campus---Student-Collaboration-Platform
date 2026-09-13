# CampusVerse

CampusVerse is a virtual campus web application where students can create campuses, invite classmates, join rooms, chat in real time, and move around a shared interactive map.

I built this project as a student to understand how a complete full-stack application works. While developing it, I learned how the frontend, backend, database, authentication, authorization, and real-time communication connect with each other in a real project.

> The core application is working and deployed. I am continuing to improve its performance, user experience, and collaboration features.

## Live Demo

- **Application:** [https://campus-verse-your.vercel.app](https://campus-verse-your.vercel.app)
- **Backend health check:** [https://campusverse-server-my.onrender.com/api/health](https://campusverse-server-my.onrender.com/api/health)

The backend uses a free hosting service, so the first request may take a short time if the server is waking up.

## Why I Built It

Students often use separate applications for group communication, study rooms, and community management. CampusVerse combines these ideas into one shared virtual space.

The project helped me move beyond small practice applications and understand real problems such as protected routes, role-based permissions, real-time synchronization, error handling, deployment, CORS, and environment configuration.

## Main Features

- User registration, login, logout, and persistent authentication
- Secure password hashing and JWT-based protected routes
- User profile, avatar, and status management
- Create public or private campuses
- Join a campus using an invite code or invite link
- View campus members and identify the campus owner
- Edit campus details and manage rooms as the owner
- Create, edit, lock, unlock, and delete rooms
- Room capacity and membership checks
- Real-time room chat with saved message history
- Shared 2D campus map with live player movement
- Multiple avatar presets
- Nearby player punch interaction with visual feedback
- Live updates when rooms are locked or deleted
- Responsive Pearl-style interface with light and dark themes

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS Modules
- GSAP
- Phaser
- Socket.IO Client
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB and Mongoose
- Socket.IO
- JSON Web Token
- bcrypt.js
- Validator

### Deployment

- Vercel for the frontend
- Render for the backend and real-time server
- MongoDB Atlas for the database

## Project Structure

```text
CampusVerse_Your/
├── Client/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── campus/
│   │   │   ├── chat/
│   │   │   ├── dashboard/
│   │   │   ├── landing/
│   │   │   ├── rooms/
│   │   │   └── world/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── lib/
│   │   └── routes/
│   ├── package.json
│   └── vercel.json
├── Server/
│   ├── src/
│   │   ├── app/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── server.js
└── README.md
```

## How the Application Works

1. A user creates an account and logs in.
2. The server verifies the credentials and returns a JWT.
3. The user can create a campus or join one using an invite code.
4. A campus owner can create and manage rooms.
5. Campus members can enter available rooms.
6. A real-time connection synchronizes chat messages, player presence, movement, and room events.
7. MongoDB stores users, campuses, rooms, and chat messages.

## Run Locally

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account or a local MongoDB database

### 1. Clone the repository

```bash
git clone https://github.com/yaaboishashank/CampusVerse_Your.git
cd CampusVerse_Your
```

### 2. Configure the backend

Create `Server/.env`:

```env
PORT=6001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Install dependencies and start the server:

```bash
cd Server
npm install
npm run dev
```

The backend will run at `http://localhost:6001`.

### 3. Configure the frontend

Create `Client/.env`:

```env
VITE_API_URL=http://localhost:6001/api
VITE_SOCKET_URL=http://localhost:6001
```

Open another terminal and run:

```bash
cd Client
npm install
npm run dev
```

Open the local URL shown by Vite in the terminal.

## Important Environment Variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Server | Connects the backend to MongoDB |
| `JWT_SECRET` | Server | Signs and verifies authentication tokens |
| `JWT_EXPIRES_IN` | Server | Controls token expiry time |
| `CLIENT_URL` | Server | Allows requests from the frontend through CORS |
| `VITE_API_URL` | Client | Connects Axios to the backend API |
| `VITE_SOCKET_URL` | Client | Connects the frontend to the real-time server |

Never commit `.env` files, passwords, database credentials, or JWT secrets to GitHub.

## API Overview

```text
/api/auth       Authentication and profile
/api/campuses   Campus creation, membership and settings
/api/rooms      Room creation, access and management
/api/messages   Room message history
/api/health     Backend health check
```

## What I Learned

Building CampusVerse taught me how different parts of a MERN application work together. Some of my main learnings were:

- Designing a modular frontend and backend folder structure
- Creating REST APIs with controllers, routes, models, and middleware
- Connecting an Express application to MongoDB using Mongoose
- Hashing passwords and implementing JWT authentication
- Protecting routes and checking owner/member permissions
- Managing React forms, state, loading states, and error messages
- Synchronizing users, chat, and player movement in real time
- Preventing invalid movement and unauthorized socket actions on the server
- Handling room deletion and access changes for connected users
- Building responsive light and dark themes with CSS Modules
- Debugging production issues related to CORS and environment variables
- Deploying one repository with separate frontend and backend services

The most challenging part was keeping multiple connected users synchronized while also handling disconnects, room permissions, locked rooms, and deleted rooms safely. Solving these problems gave me a much better understanding of full-stack development.

## Testing

The project has been manually tested with multiple accounts using a normal browser window and an Incognito window. Major tested flows include:

- Registration, login, logout, and session restoration
- Campus creation and invite-based joining
- Owner and member permission checks
- Room creation, editing, locking, and deletion
- Two-user chat and saved message history
- Two-user presence and movement synchronization
- Punch effects and room activity messages
- Live disconnection after room deletion or access removal
- Light mode, dark mode, responsive layouts, and route refreshes
- Production frontend, backend, database, API, and CORS connection

## Current Limitations

- The interactive map is currently designed mainly for desktop use.
- Voice and video calling are not part of the current version.
- The free backend service may take time to wake up after being idle.
- Real-time presence is stored in server memory, so horizontal scaling would require shared presence storage.

## Future Improvements

- Voice and video rooms
- Direct messages and notifications
- More campus maps and room layouts
- Better mobile controls for the interactive map
- Shared presence storage for multiple backend instances
- Automated API and end-to-end tests
- Improved accessibility and performance

## Author

**yaaboishashank**

MCA student and full-stack development learner. I enjoy building practical projects that help me understand how real applications are designed, connected, tested, and deployed.

If you find this project useful, feel free to explore the repository and share feedback.
