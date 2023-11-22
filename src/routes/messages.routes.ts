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
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const messages = (await collections
      .messages!.find({})
      .toArray()) as unknown as Message[];

    cResponse.status = "SUCCESS";
    cResponse.message = "Messages fetched from MongoDB";
    cResponse.payload = messages;

    res.status(200).send(messages);
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when fetching from MongoDB";
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(500).send(cResponse);
  }
});

// POST
messagesRouter.post("/", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    req.body.sentAt = new Date();

    const newMessage = req.body as Message;
    const result = await collections.messages!.insertOne(newMessage);

    // cResponse.status = "SUCCESS";
    // cResponse.message = `Successfully created a new message with id ${result.insertedId}`;
    // cResponse.payload = updatedUser;

    // cResponse.status = "ERROR";
    // cResponse.message = "Failed to create a new message";
    // cResponse.payload = undefined;

    result
      ? res
          .status(201)
          .send(
            `Successfully created a new message with id ${result.insertedId}`
          )
      : res.status(500).send("Failed to create a new message");
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when creating message";
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

// DELETE
messagesRouter.delete("/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await collections.messages!.deleteOne(query);

    if (result && result.deletedCount) {
      cResponse.status = "SUCCESS";
      cResponse.message = `Successfully removed message with id ${id}`;
      cResponse.payload = result.deletedCount;

      res.status(202).send(cResponse);
    } else if (!result) {
      cResponse.status = "ERROR";
      cResponse.message = `Failed to remove message with id ${id}`;
      cResponse.payload = undefined;

      res.status(400).send(cResponse);
    } else if (!result.deletedCount) {
      cResponse.status = "ERROR";
      cResponse.message = `Message with id ${id} does not exist`;
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    if (e instanceof Error) {
      cResponse.status = "ERROR";
      cResponse.message = "Error when deleting message";
      cResponse.payload = e;

      if (e instanceof Error) cResponse.payload = e.message;
      res.status(400).send(cResponse);
    }
  }
});
