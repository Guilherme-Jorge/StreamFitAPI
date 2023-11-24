import express, { Application } from "express";
import { connectToDatabase } from "./services/database.service";
import { usersRouter } from "./routes/users.routes";
import { messagesRouter } from "./routes/messages.routes";
import { livesRouter } from "./routes/lives.routes";

const app: Application = express();
const port: number = 3000;

connectToDatabase()
  .then(() => {

    /**
     * * GET    http://localhost:3000/users
     * Get all users
     * * GET    http://localhost:3000/users/personais
     * Get all users with accountType "personal"
     * * GET    http://localhost:3000/users/user/:id
     * Get user with "id"
     * * GET    http://localhost:3000/users/pwdDecrypted/:id
     * Get user with "id" where the password is decrypted
     * ? POST   http://localhost:3000/users
     * Post user from request body and get the id from that new user
     * ? POST   http://localhost:3000/users/login
     * Get user if email and password are correct
     * TODO PUT http://localhost:3000/users/user/:id
     * Update user with id from request body and get updated user
     * TODO PUT http://localhost:3000/users/follow/:personalId
     * Add follow to personal with personalId and add the user's id to followers in personal
     * TODO PUT http://localhost:3000/users/unfollow/:personalId
     * Remove follow to personal with personalId and remove the user's id to followers in personal
     * TODO PUT http://localhost:3000/users/subscribe/:personalId
     * Add subscribe to personal with personalId and add the user's id to subscribers in personal
     * TODO PUT http://localhost:3000/users/unsubscribe/:personalId
     * Remove subscribe to personal with personalId and remove the user's id to subscribers in personal
     * ! DELETE http://localhost:3000/users/:id
     * Delete user with id
     */
    app.use("/users", usersRouter);

    /**
     * * GET    http://localhost:3000/messages
     * Get all messages
     * * GET    http://localhost:3000/messages/:id
     * Get most recent messages (and the other user) between users that the user id has conversations with
     * * GET    http://localhost:3000/messages/:id/:sendId
     * Get messages between sender id and reciever sendId
     * ? POST   http://localhost:3000/messages
     * Post message from request body and get the id from that new message
     * TODO PUT http://localhost:3000/messages/:id
     * Update message with id from request body and get updated message
     * ! DELETE http://localhost:3000/messages/:id
     * Delete message with id
     */
    app.use("/messages", messagesRouter);

    /**
     * * GET    http://localhost:3000/lives
     * Get all lives
     * * GET    http://localhost:3000/lives/currentAll
     * Get all lives with active = true
     * * GET    http://localhost:3000/lives/currentFlw/:id
     * Get lives from personal (that user with id follows) with active = true 
     * ? POST   http://localhost:3000/lives
     * Post live from request body and get the id from that new live
     * TODO PUT http://localhost:3000/lives/:id
     * Update live with id from request body and get updated live
     * ! DELETE http://localhost:3000/lives/:id
     * Delete live with id
     */
    app.use("/lives", livesRouter);

    app.listen(port, () => {
      console.log(`API started at http://localhost:${port}`);
    });
  })
  .catch((e: Error) => {
    console.error("Database connection failed", e);
    process.exit();
  });
