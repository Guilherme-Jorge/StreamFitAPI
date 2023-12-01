//* External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";
import User from "../models/user";
import { createConnection } from "net";

//* Global Config

// Creating router from index.js
export const usersRouter = express.Router();

// Setting up router to use express
usersRouter.use(express.json());

// Custom response type for methods returns
type CustomResponse = {
  status: string | unknown;
  message: string | unknown;
  payload: unknown;
};

// Connection to Java Cipher server for password
const host: string = "localhost";
const port: number = 12345;

//* Functions
function arrayRemove(arr: any, value: any) {
  return arr.filter((elem: any) => {
    return elem != value;
  });
}

/**
 ** --------------
 **      GET
 ** --------------
 *  */

/**
 * Method that gets all Users
 * from the users collection on MongoDB
 */
usersRouter.get("/", async (_req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  // Try in case of failed access to MongoDB
  try {
    // Fetching all users from collection on MongoDB
    const users = (await collections
      .users!.find({})
      .toArray()) as unknown as User[];

    // Changing response to successful with all users
    cResponse.status = "SUCCESS";
    cResponse.message = "Users fetched from MongoDB";
    cResponse.payload = users;

    // Sending response with success status
    res.status(200).send(cResponse);
  } catch (e) {
    //! In case of error
    // Changing response to error with error message
    cResponse.status = "ERROR";
    cResponse.message = "Error when fetching from MongoDB";
    if (e instanceof Error) cResponse.payload = e.message;

    // Sending response with error status
    res.status(500).send(cResponse);
  }
});

/**
 *
 */
usersRouter.get("/personais/", async (_req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const users = (await collections
      .users!.find({})
      .filter({ accountType: "personal" })
      .sort({ createdAt: -1 })
      .toArray()) as unknown as User[];

    const personais: any[] = [];
    users.forEach((user) => {
      const personal = {
        _id: user._id,
        name: user.name,
        degree: user.degree,
        description: user.description,
        subscribers: user.subscribers?.length,
        followers: user.followers?.length,
      };
      personais.push(personal);
    });

    cResponse.status = "SUCCESS";
    cResponse.message = "Personais fetched from MongoDB";
    cResponse.payload = personais;

    res.status(200).send(cResponse);
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when fetching from MongoDB";
    if (e instanceof Error) cResponse.payload = e.message;
    res.status(500).send(cResponse);
  }
});

/**
 *
 */
usersRouter.get("/user/:id", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const user = (await collections.users!.findOne(query)) as unknown as User;

    if (user) {
      cResponse.status = "SUCCESS";
      cResponse.message = `Document found for user ${req.params.id}`;
      cResponse.payload = user;

      res.status(200).send(cResponse);
    } else {
      cResponse.status = "ERROR";
      cResponse.message = `Unable to find matching document with id: ${req.params.id}`;
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Unable to find matching document with id: ${req.params.id}`;
    cResponse.payload = e;

    res.status(404).send(cResponse);
  }
});

/**
 *
 */
usersRouter.get("/pwdDecrypted/:id", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const user = (await collections.users!.findOne(query)) as unknown as User;

    const client = createConnection(port, host, () => {
      client.write(`DECRYPT:${user.pwd}\n`);
    });

    client.on("data", async (data) => {
      const pwdDecrypted = data.toString().split(/(?:\r\n|\r|\n)/g);
      user.pwd = pwdDecrypted[0];

      client.write("exit\n");

      if (user) {
        cResponse.status = "SUCCESS";
        cResponse.message = `Document with decrypted password found for user ${req.params.id}`;
        cResponse.payload = user;

        res.status(200).send(cResponse);
      }
    });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Unable to find matching document with id: ${req.params.id}`;
    cResponse.payload = e;

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
usersRouter.post("/", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const users = (await collections
      .users!.find({})
      .toArray()) as unknown as User[];

    if (!users.some((user) => user.email == req.body.email)) {
      const client = createConnection(port, host, () => {
        client.write(`ENCRYPT:${req.body.pwd}\n`);
      });

      client.on("data", async (data) => {
        const newUser = req.body as User;

        const newPwd = data.toString().split(/(?:\r\n|\r|\n)/g);
        newUser.pwd = newPwd[0];

        newUser.createdAt = new Date();
        newUser.updatedAt = new Date();

        if (newUser.accountType == "aluno") {
          newUser.plan = "free";
          newUser.personalFlw = [];
          newUser.personalSubs = [];
        } else {
          newUser.followers = [];
          newUser.subscribers = [];
        }

        const result = await collections.users!.insertOne(newUser);

        client.write("exit\n");

        result
          ? res.status(201).send({
              status: "SUCCESS",
              message: `Successfully created a new user with id ${result.insertedId}`,
              payload: result.insertedId,
            })
          : res.status(500).send({
              status: "ERROR",
              message: "Failed to create a new user",
            });
      });
    } else {
      cResponse.status = "ERROR";
      cResponse.message = `User with email ${req.body.email} already exists`;
      cResponse.payload = undefined;

      res.status(400).send(cResponse);
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when creating user";
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

/**
 *
 */
usersRouter.post("/login/", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const client = createConnection(port, host, () => {
      client.write(`ENCRYPT:${req.body.pwd}\n`);
    });

    client.on("data", async (data) => {
      const pwd = data.toString().split(/(?:\r\n|\r|\n)/g);

      const user = (await collections.users!.findOne({
        email: req.body.email,
        pwd: pwd[0],
      })) as unknown as User;

      if (user) {
        cResponse.status = "SUCCESS";
        cResponse.message = `Login was validated for user with email: ${req.body.email}`;
        cResponse.payload = user;

        res.status(200).send(cResponse);
      } else {
        cResponse.status = "ERROR";
        cResponse.message = `Unable to find matching user with email: ${req.body.email}`;
        cResponse.payload = undefined;

        res.status(404).send(cResponse);
      }
    });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Unable to find matching user with email: ${req.body.email}`;
    cResponse.payload = e;

    res.status(404).send(cResponse);
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
usersRouter.put("/user/:id", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };

    if (req.body.pwd) {
      const client = createConnection(port, host, () => {
        client.write(`ENCRYPT:${req.body.pwd}\n`);
      });

      client.on("data", async (data) => {
        req.body.updatedAt = new Date();
        const newPwd = data.toString().split(/(?:\r\n|\r|\n)/g);
        req.body.pwd = newPwd[0];
        const updatedUser: User = req.body as User;

        const result = await collections.users!.updateOne(query, {
          $set: updatedUser,
        });

        client.write("exit\n");

        result
          ? res.status(200).send({
              status: "SUCCESS",
              message: `Successfully updated user with id ${id}`,
              payload: updatedUser,
            })
          : res.status(304).send({
              status: "ERROR",
              message: `User with id ${id} not updated`,
            });
      });
    } else {
      const updatedUser: User = req.body as User;

      const result = await collections.users!.updateOne(query, {
        $set: updatedUser,
      });

      result
        ? res.status(200).send({
            status: "SUCCESS",
            message: `Successfully updated user with id ${id}`,
            payload: updatedUser,
          })
        : res.status(304).send({
            status: "ERROR",
            message: `User with id ${id} not updated`,
          });
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Error when updating user with id ${id}`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

/**
 *
 */
usersRouter.put("/follow/:personalId", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.body?.id;
  const personalId = req?.params?.personalId;

  try {
    const queryAluno = { _id: new ObjectId(id) };
    const queryPersonal = { _id: new ObjectId(personalId) };

    const aluno = (await collections.users!.findOne(
      queryAluno
    )) as unknown as User;

    const personal = (await collections.users!.findOne(
      queryPersonal
    )) as unknown as User;

    aluno.personalFlw?.push(personalId);
    personal.followers?.push(id);

    await collections.users!.updateOne(queryPersonal, {
      $set: { followers: personal.followers },
    });

    const result = await collections.users!.updateOne(queryAluno, {
      $set: { personalFlw: aluno.personalFlw },
    });

    result
      ? res.status(200).send({
          status: "SUCCESS",
          message: `Successfully updated user with id ${id}`,
          payload: aluno,
        })
      : res.status(304).send({
          status: "ERROR",
          message: `Live with id ${id} not updated`,
        });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Error when updating user with id ${id}`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

/**
 *
 */
usersRouter.put(
  "/unfollow/:personalId",
  async (req: Request, res: Response) => {
    // Creating default custom response in case of error
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Unable to execute function",
      payload: undefined,
    };

    const id = req?.body?.id;
    const personalId = req?.params?.personalId;

    try {
      const queryAluno = { _id: new ObjectId(id) };
      const queryPersonal = { _id: new ObjectId(personalId) };

      const aluno = (await collections.users!.findOne(
        queryAluno
      )) as unknown as User;

      const personal = (await collections.users!.findOne(
        queryPersonal
      )) as unknown as User;

      aluno.personalFlw = arrayRemove(aluno.personalFlw, personalId);
      personal.followers = arrayRemove(personal.followers, id);

      await collections.users!.updateOne(queryPersonal, {
        $set: { followers: personal.followers },
      });

      const result = await collections.users!.updateOne(queryAluno, {
        $set: { personalFlw: aluno.personalFlw },
      });

      result
        ? res.status(200).send({
            status: "SUCCESS",
            message: `Successfully updated user with id ${req.body.id}`,
            payload: aluno,
          })
        : res.status(304).send({
            status: "ERROR",
            message: `Live with id ${req.body.id} not updated`,
          });
    } catch (e) {
      cResponse.status = "ERROR";
      cResponse.message = `Error when updating user with id ${id}`;
      cResponse.payload = e;

      if (e instanceof Error) cResponse.payload = e.message;
      res.status(400).send(cResponse);
    }
  }
);

/**
 *
 */
usersRouter.put(
  "/subscribe/:personalId",
  async (req: Request, res: Response) => {
    // Creating default custom response in case of error
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Unable to execute function",
      payload: undefined,
    };

    const id = req?.body?.id;
    const personalId = req?.params?.personalId;

    try {
      const queryAluno = { _id: new ObjectId(id) };
      const queryPersonal = { _id: new ObjectId(personalId) };

      const aluno = (await collections.users!.findOne(
        queryAluno
      )) as unknown as User;

      const personal = (await collections.users!.findOne(
        queryPersonal
      )) as unknown as User;

      aluno.personalSubs?.push(personalId);
      personal.subscribers?.push(id);

      await collections.users!.updateOne(queryPersonal, {
        $set: { subscribers: personal.subscribers },
      });

      const result = await collections.users!.updateOne(queryAluno, {
        $set: { personalSubs: aluno.personalSubs },
      });

      result
        ? res.status(200).send({
            status: "SUCCESS",
            message: `Successfully updated user with id ${id}`,
            payload: aluno,
          })
        : res.status(304).send({
            status: "ERROR",
            message: `Live with id ${id} not updated`,
          });
    } catch (e) {
      cResponse.status = "ERROR";
      cResponse.message = `Error when updating user with id ${id}`;
      cResponse.payload = e;

      if (e instanceof Error) cResponse.payload = e.message;
      res.status(400).send(cResponse);
    }
  }
);

/**
 *
 */
usersRouter.put(
  "/unsubscribe/:personalId",
  async (req: Request, res: Response) => {
    // Creating default custom response in case of error
    const cResponse: CustomResponse = {
      status: "ERROR",
      message: "Unable to execute function",
      payload: undefined,
    };

    const id = req?.body?.id;
    const personalId = req?.params?.personalId;

    try {
      const queryAluno = { _id: new ObjectId(id) };
      const queryPersonal = { _id: new ObjectId(personalId) };

      const aluno = (await collections.users!.findOne(
        queryAluno
      )) as unknown as User;

      const personal = (await collections.users!.findOne(
        queryPersonal
      )) as unknown as User;

      aluno.personalSubs = arrayRemove(aluno.personalSubs, personalId);
      personal.subscribers = arrayRemove(personal.subscribers, id);

      await collections.users!.updateOne(queryPersonal, {
        $set: { subscribers: personal.subscribers },
      });

      const result = await collections.users!.updateOne(queryAluno, {
        $set: { personalSubs: aluno.personalSubs },
      });

      result
        ? res.status(200).send({
            status: "SUCCESS",
            message: `Successfully updated user with id ${req.body.id}`,
            payload: aluno,
          })
        : res.status(304).send({
            status: "ERROR",
            message: `Live with id ${req.body.id} not updated`,
          });
    } catch (e) {
      cResponse.status = "ERROR";
      cResponse.message = `Error when updating user with id ${req.body.id}`;
      cResponse.payload = e;

      if (e instanceof Error) cResponse.payload = e.message;
      res.status(400).send(cResponse);
    }
  }
);

/**
 *! --------------
 *!     DELETE
 *! --------------
 *  */

/**
 *
 */
usersRouter.delete("/:id", async (req: Request, res: Response) => {
  // Creating default custom response in case of error
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await collections.users!.deleteOne(query);

    if (result && result.deletedCount) {
      cResponse.status = "SUCCESS";
      cResponse.message = `Successfully removed user with id ${id}`;
      cResponse.payload = result.deletedCount;

      res.status(202).send(cResponse);
    } else if (!result) {
      cResponse.status = "ERROR";
      cResponse.message = `Failed to remove user with id ${id}`;
      cResponse.payload = undefined;

      res.status(400).send(cResponse);
    } else if (!result.deletedCount) {
      cResponse.status = "ERROR";
      cResponse.message = `User with id ${id} does not exist`;
      cResponse.payload = undefined;

      res.status(404).send(cResponse);
    }
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Error when deleting user with id ${id}`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});
