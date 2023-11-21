// External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";
import Message from "../models/message";

// Global Config
export const messagesRouter = express.Router();

messagesRouter.use(express.json());

type CustomResponse = {
  status: string | unknown;
  message: string | unknown;
  payload: unknown;
};

// GET
messagesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const messages = (await collections
      .messages!.find({})
      .toArray()) as unknown as Message[];

    res.status(200).send(messages);
  } catch (e) {
    if (e instanceof Error) res.status(500).send(e.message);
  }
});

// POST
messagesRouter.post("/", async (req: Request, res: Response) => {
  try {
    req.body.sentAt = new Date();

    const newMessage = req.body as Message;
    const result = await collections.messages!.insertOne(newMessage);

    result
      ? res
          .status(201)
          .send(
            `Successfully created a new message with id ${result.insertedId}`
          )
      : res.status(500).send("Failed to create a new message.")
   } catch (e) {
    console.error(e);
    if (e instanceof Error) res.status(400).send(e.message);
   }
  });

// DELETE
messagesRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await collections.messages!.deleteOne(query);

    if (result && result.deletedCount) {
      res.status(202).send(`Successfully removed message with id ${id}`);
    } else if (!result) {
      res.status(400).send(`Failed to remove message with id ${id}`);
    } else if (!result.deletedCount) {
      res.status(404).send(`Message with id ${id} does not exist`);
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(400).send(e.message);
    }
  }
});
