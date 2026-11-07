# Secure Connect and Communication Platform

A secure Node.js backend with signup/login, JWT authentication, role-based access control, a private Notes API, real-time chat with Socket.IO, and event-driven logging with EventEmitter.

Built for Web Dev III, Lab 4.

## Tech stack

Node.js, Express, MongoDB (Mongoose), jsonwebtoken, bcrypt, dotenv, Socket.IO

## Features

- Signup and login with bcrypt-hashed passwords
- Stateless sessions with JWT
- Protected routes and role-based access control (`user` and `admin`)
- Notes API where every user can only access their own notes
- Real-time chat with rooms; the socket connection is authenticated with the JWT
- Event-driven logging with Node's EventEmitter (new users, failed-login alerts, note changes, chat messages)

## Setup

1. Install dependencies: `npm install`
2. Make sure MongoDB is running locally.
3. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
4. Start the server: `npm run dev` (or `npm start`)

The server runs on `http://localhost:5000`.

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |

## API endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register a user |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/users/me` | Logged in | Current user's profile |
| GET | `/api/users` | Admin | List all users |
| POST | `/api/notes` | Logged in | Create a note |
| GET | `/api/notes` | Logged in | List your notes |
| GET | `/api/notes/:id` | Owner | Get one note |
| PUT | `/api/notes/:id` | Owner | Update a note |
| DELETE | `/api/notes/:id` | Owner or admin | Delete a note |

Send the token as `Authorization: Bearer <token>`.

## Real-time chat

Open `http://localhost:5000`, log in, and chat. Open a second tab with another user to see messages arrive in real time.

| Socket event | Direction | Description |
|---|---|---|
| `joinRoom` | client → server | Join a room |
| `leaveRoom` | client → server | Leave a room |
| `chatMessage` | client → server | Send a message to a room |
| `announce` | client → server | Admin-only broadcast |
| `message` | server → client | A chat message |
| `system` | server → client | Join/leave/announcement notices |

The socket connection requires a valid JWT in `auth.token`. The sender's name always comes from the verified token.

## Creating an admin

Signup always creates a normal user. To make an admin, change the user's `role` to `admin` directly in the database (for example in MongoDB Compass).

## Events (EventEmitter)

`userRegistered`, `userLoggedIn`, `loginFailed` (alert after 3 failed attempts), `noteCreated`, `noteDeleted`, `serverStarted` (`once`), plus chat events.

