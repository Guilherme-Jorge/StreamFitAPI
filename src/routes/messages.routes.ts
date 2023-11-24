//* External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";
import Message from "../models/message";
import User from "../models/user";

//* Global Config

// Creating router from index.js
export const messagesRouter = express.Router();

// Setting up router to use express
messagesRouter.use(express.json());

// Custom response type for methods returns
type CustomResponse = {
  status: string | unknown;
  message: string | unknown;
  payload: unknown;
};

/**
 ** --------------
 **      GET
 ** --------------
 *  */

/**
 *
 */
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

    res.status(200).send(cResponse);
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when fetching from MongoDB";
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(500).send(cResponse);
  }
});

/**
 *
 */
messagesRouter.get("/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const query = {
      $or: [{ sendId: req.params.id }, { recieveId: req.params.id }],
    };
    const messages = (await collections
      .messages!.find(query)
      .sort({ sentAt: -1 })
      .toArray()) as unknown as Message[];

    if (messages.length != 0) {
      const users: String[] = [];
      messages.forEach((message) => {
        if (
          !users.includes(message.sendId) &&
          message.sendId != req.params.id
        ) {
          users.push(message.sendId);
        } else if (
          !users.includes(message.recieveId) &&
          message.recieveId != req.params.id
        ) {
          users.push(message.recieveId);
        }
      });

      const latestMessages: { user: any; message?: Message }[] = [];

      for (let i = 0; i < users.length; i++) {
        const newQuerySend = {
          $and: [{ sendId: users[i] as string }, { recieveId: req.params.id }],
        };
        const newQueryRecieve = {
          $and: [{ sendId: req.params.id }, { recieveId: users[i] as string }],
        };

        const fullUser = (await collections.users!.findOne({
          _id: new ObjectId(users[i].toString()),
        })) as unknown as User;

        const messageSend = (await collections
          .messages!.find(newQuerySend)
          .sort({ sentAt: -1 })
          .limit(1)
          .next()) as unknown as Message;

        const messageRecieve = (await collections
          .messages!.find(newQueryRecieve)
          .sort({ sentAt: -1 })
          .limit(1)
          .next()) as unknown as Message;

        if (messageSend != null && messageRecieve != null) {
          if (messageSend.sentAt > messageRecieve.sentAt)
            latestMessages.push({ user: fullUser, message: messageSend });
          else
            latestMessages.push({
              user: fullUser,
              message: messageRecieve,
            });
        } else if (messageSend == null && messageRecieve != null)
          latestMessages.push({ user: fullUser, message: messageRecieve });
        else if (messageSend != null && messageRecieve == null)
          latestMessages.push({ user: fullUser, message: messageSend });

        console.log("\n\nLatest before" + latestMessages);
      }

      const currentUser = (await collections.users!.findOne({
        _id: new ObjectId(req.params.id),
      })) as unknown as User;

      if (currentUser.accountType == "aluno") {
        if (currentUser.personalFlw)
          currentUser.personalFlw.forEach(async (personal) => {
            const fullUser = (await collections.users!.findOne({
              _id: new ObjectId(personal.toString()),
            })) as unknown as User;

            if (latestMessages.every((message) => message.user != personal))
              latestMessages.push({ user: fullUser, message: undefined });
          });
        if (currentUser.personalSubs)
          currentUser.personalSubs.forEach(async (personal) => {
            const fullUser = (await collections.users!.findOne({
              _id: new ObjectId(personal.toString()),
            })) as unknown as User;

            if (latestMessages.every((message) => message.user != personal))
              latestMessages.push({ user: fullUser, message: undefined });
          });
      }

      cResponse.status = "SUCCESS";
      cResponse.message = `Latest messages for user ${req.params.id} where found`;
      cResponse.payload = latestMessages;

      res.status(200).send(cResponse);
    } else {
      cResponse.status = "ERROR";
      cResponse.message = `Messages for user ${req.params.id} not found`;
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Messages for user ${req.params.id} not found`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(404).send(cResponse);
  }
});


/**
 *
 */
messagesRouter.get("/:id/:sendId", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const query = {
      $or: [
        { $and: [{ sendId: req.params.id }, { recieveId: req.params.sendId }] },
        { $and: [{ sendId: req.params.sendId }, { recieveId: req.params.id }] },
      ],
    };
    const messages = (await collections
      .messages!.find(query)
      .sort({ sentAt: 1 })
      .toArray()) as unknown as Message[];

    if (messages.length != 0) {
      cResponse.status = "SUCCESS";
      cResponse.message = `Latest messages between user ${req.params.id} and user ${req.params.sendId} where found`;
      cResponse.payload = messages;

      res.status(200).send(cResponse);
    } else {
      cResponse.status = "ERROR";
      cResponse.message = `Messages between user ${req.params.id} and user ${req.params.sendId} not found`;
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Messages between user ${req.params.id} and user ${req.params.sendId} not found`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(404).send(cResponse);
  }
});

/**
 *? --------------
 *?      POST
 *? --------------
 *  */

/**
 *
 */
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

    result
      ? res.status(201).send({
          status: "SUCCESS",
          message: `Successfully created a new message with id ${result.insertedId}`,
          payload: result.insertedId,
        })
      : res.status(500).send({
          status: "ERROR",
          message: "Failed to create a new message",
        });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when creating message";
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

/**
 *TODO --------------
 *TODO      PUT
 *TODO --------------
 *  */

/**
 *
 */
messagesRouter.put("/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const updatedMessage: Message = req.body as Message;

    const result = await collections.lives!.updateOne(query, {
      $set: updatedMessage,
    });

    result
      ? res.status(200).send({
          status: "SUCCESS",
          message: `Successfully updated message with id ${id}`,
          payload: updatedMessage,
        })
      : res.status(304).send({
          status: "ERROR",
          message: `Message with id ${id} not updated`,
        });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Error when updating message with id ${id}`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

/**
 *! --------------
 *!     DELETE
 *! --------------
 *  */

/**
 *
 */
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
