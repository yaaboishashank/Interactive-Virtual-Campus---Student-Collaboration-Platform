# CampusVerse Server

Node.js and Express backend for CampusVerse. It provides the REST API for
accounts, campuses, rooms and messages, and a Socket.IO layer for real-time
chat, presence and avatar movement.

## Stack

- Express 5 with Mongoose (MongoDB)
- JSON Web Tokens (jsonwebtoken) with bcryptjs password hashing
- Socket.IO for real-time events
- dotenv, cors, validator

## Run

```bash
cd Server
npm install
npm run dev
```

`npm run dev` uses nodemon; `npm start` runs without auto-restart.
The server listens on `PORT` (default `6001`) and exposes a health check at
`http://localhost:6001/api/health`.

See the root README for the full environment-variable table
(`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`).

## Layout

```
server.js                  Entry point: connects MongoDB, attaches Socket.IO
src/app/app.js             Express app: CORS, JSON body parsing, routes, health
src/config/db.js           MongoDB connection
src/controllers/           auth, campus, room and message handlers
src/middlewares/           JWT auth guard (protect)
src/models/                user, campus, room and message schemas
src/routes/                REST routers mounted under /api
src/services/              Socket.IO gateway, presence, room access and queue,
                           message and punch services
```

## REST API

All routes except registration, login and the health check require a valid
JWT (`Authorization: Bearer <token>`).

### /api/auth

| Method | Path      | Purpose                        |
| ------ | --------- | ------------------------------ |
| POST   | /register | Create an account              |
| POST   | /login    | Log in and receive a token     |
| GET    | /me       | Current user's profile         |
| PATCH  | /me       | Update profile (name, avatar)  |

### /api/campuses (auth required)

| Method | Path                 | Purpose                       |
| ------ | -------------------- | ----------------------------- |
| POST   | /                    | Create a campus               |
| GET    | /                    | List my campuses              |
| POST   | /join                | Join a campus by invite code  |
| GET    | /invite/:inviteCode  | Look up an invite             |
| POST   | /:id/leave           | Leave a campus                |
| GET    | /:id                 | Campus details                |
| PATCH  | /:id                 | Update a campus (owner)       |
| DELETE | /:id                 | Delete a campus (owner)       |

### /api/rooms (auth required)

| Method | Path          | Purpose                          |
| ------ | ------------- | -------------------------------- |
| POST   | /:campusId    | Create a room in a campus        |
| GET    | /:campusId    | List a campus's rooms            |
| GET    | /details/:id  | Room details                     |
| PATCH  | /:id          | Update a room (edit, lock)       |
| DELETE | /:id          | Delete a room                    |

### /api/messages (auth required)

| Method | Path     | Purpose                   |
| ------ | -------- | ------------------------- |
| POST   | /:roomId | Save a message to a room  |
| GET    | /:roomId | Room message history      |

## Real-time events (Socket.IO)

The socket gateway authenticates each connection with the same JWT.
Client to server:

| Event                   | Payload purpose                        |
| ----------------------- | -------------------------------------- |
| join-campus-presence    | Appear online in a campus              |
| leave-campus-presence   | Leave a campus presence list           |
| join-room               | Enter a room (access-checked)          |
| leave-room              | Exit a room                            |
| player-move             | Update avatar position                 |
| send-message            | Send a chat message to the room        |
| typing-start / typing-stop | Typing indicators                   |

Server to client:

| Event               | Meaning                                  |
| ------------------- | ---------------------------------------- |
| receive-message     | New room chat message                    |
| player-joined / player-left / player-moved | Room avatar state     |
| profile-updated     | A campus member changed their profile    |
| room-updated        | Room settings changed                    |
| room-access-revoked | You lost access to a room                |
| campus-deleted      | A campus you were in was deleted         |
| socket-error        | Request rejected (with a reason)         |

This document describes the current source and was written from the code,
not from a running instance.
