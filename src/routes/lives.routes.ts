//* External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";
import Live from "../models/lives";
import User from "../models/user";

//* Global Config

// Creating router from index.js
export const livesRouter = express.Router();

// Setting up router to use express
livesRouter.use(express.json());

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
livesRouter.get("/", async (_req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const lives = (await collections
      .lives!.find({})
      .toArray()) as unknown as Live[];

    cResponse.status = "SUCCESS";
    cResponse.message = "Lives fetched from MongoDB";
    cResponse.payload = lives;

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
livesRouter.get("/currentAll", async (_req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const lives = (await collections
      .lives!.find({ active: true })
      .toArray()) as unknown as Live[];

    cResponse.status = "SUCCESS";
    cResponse.message = "Current lives fetched from MongoDB";
    cResponse.payload = lives;

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
livesRouter.get("/currentFlw/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const currentUser = (await collections.users!.findOne({
      _id: new ObjectId(req.params.id),
    })) as unknown as User;

    const followedPersonal: String[] = currentUser.personalFlw!;

    if (followedPersonal.length != 0) {
      const currentLives: { personal: User; live: Live }[] = [];

      for (let i = 0; i < followedPersonal.length; i++) {
        const live = (await collections.lives!.findOne({
          personal: followedPersonal[i],
          active: true,
        })) as unknown as Live;

        if (live != null) {
          const personal = (await collections.users!.findOne({
            _id: new ObjectId(followedPersonal[i] as string),
          })) as unknown as User;

          currentLives.push({ personal: personal, live: live });
        }
      }

      currentLives.sort(
        (live1, live2) =>
          live1.live.createdAt.getUTCMilliseconds() -
          live2.live.createdAt.getUTCMilliseconds()
      );

      cResponse.status = "SUCCESS";
      cResponse.message = "Followed lives fetched from MongoDB";
      cResponse.payload = currentLives;

      res.status(200).send(cResponse);
    } else {
      cResponse.status = "ERROR";
      cResponse.message = "User doesn't follow any personal";
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when fetching from MongoDB";
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(500).send(cResponse);
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
livesRouter.post("/", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    req.body.createdAt = new Date();

    const newLive = req.body as Live;
    const result = await collections.lives!.insertOne(newLive);

    result
      ? res.status(201).send({
          status: "SUCCESS",
          message: `Successfully created a new live with id ${result.insertedId}`,
          payload: result.insertedId,
        })
      : res.status(500).send({
          status: "ERROR",
          message: "Failed to create a new live",
        });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when creating live";
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
livesRouter.put("/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const updatedLive: Live = req.body as Live;

    const result = await collections.lives!.updateOne(query, {
      $set: updatedLive,
    });

    result
      ? res.status(200).send({
          status: "SUCCESS",
          message: `Successfully updated live with id ${id}`,
          payload: updatedLive,
        })
      : res.status(304).send({
          status: "ERROR",
          message: `Live with id ${id} not updated`,
        });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Error when updating live with id ${id}`;
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
livesRouter.delete("/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await collections.lives!.deleteOne(query);

    if (result && result.deletedCount) {
      cResponse.status = "SUCCESS";
      cResponse.message = `Successfully removed live with id ${id}`;
      cResponse.payload = result.deletedCount;

      res.status(202).send(cResponse);
    } else if (!result) {
      cResponse.status = "ERROR";
      cResponse.message = `Failed to remove live with id ${id}`;
      cResponse.payload = undefined;

      res.status(400).send(cResponse);
    } else if (!result.deletedCount) {
      cResponse.status = "ERROR";
      cResponse.message = `Live with id ${id} does not exist`;
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    if (e instanceof Error) {
      cResponse.status = "ERROR";
      cResponse.message = "Error when deleting live";
      cResponse.payload = e;

      if (e instanceof Error) cResponse.payload = e.message;
      res.status(400).send(cResponse);
    }
  }
});
