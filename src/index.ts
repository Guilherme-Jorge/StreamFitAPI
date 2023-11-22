import express, { Application } from "express";
import { connectToDatabase } from "./services/database.service";
import { usersRouter } from "./routes/users.routes";
import { messagesRouter } from "./routes/messages.routes";

const app: Application = express();
const port: number = 3000;

connectToDatabase()
  .then(() => {
    app.use("/users", usersRouter);

    app.use("/messages", messagesRouter)

    app.listen(port, () => {
      console.log(`API started at http://localhost:${port}`);
    });
  })
  .catch((e: Error) => {
    console.error("Database connection failed", e);
    process.exit();
  });
