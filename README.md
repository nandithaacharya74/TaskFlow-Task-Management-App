# TaskFlow — Task Management Application

A full-stack task management app built for the assignment.

## Features
- User registration and login
- JWT authentication and authorization
- Create, read, update, and delete tasks
- Task statuses: Pending, In Progress, Completed
- Search and status filtering
- Responsive desktop/mobile UI
- MongoDB persistence
- Password hashing with bcrypt

## Run locally

1. Install Node.js.
2. Open this folder in VS Code.
3. Run:
   `npm install`
4. Rename `.env.example` to `.env`.
5. Put your MongoDB Atlas connection string in `MONGODB_URI`.
6. Set a strong value for `JWT_SECRET`.
7. Run:
   `npm start`
8. Open `http://localhost:5000`

## MongoDB Atlas
Create a database user and allow your current IP in Network Access. The app will create the `taskflow` database and collections automatically when you register and create tasks.

## Deployment
This project needs a Node.js-capable host for the Express backend. GitHub Pages alone cannot run the API or MongoDB connection.
