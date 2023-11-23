// External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";
import User from "../models/user";
import { createConnection } from "net";

// Global Config
export const usersRouter = express.Router();

usersRouter.use(express.json());

type CustomResponse = {
  status: string | unknown;
  message: string | unknown;
  payload: unknown;
};

const host: string = "localhost";
const port: number = 12345;

// GET
usersRouter.get("/", async (_req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  try {
    const users = (await collections
      .users!.find({})
      .toArray()) as unknown as User[];

    cResponse.status = "SUCCESS";
    cResponse.message = "Users fetched from MongoDB";
    cResponse.payload = users;

    res.status(200).send(cResponse);
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = "Error when fetching from MongoDB";
    if (e instanceof Error) cResponse.payload = e.message;
    res.status(500).send(cResponse);
  }
});

usersRouter.get("/personais/", async (_req: Request, res: Response) => {
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

usersRouter.get("/user/:id", async (req: Request, res: Response) => {
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

usersRouter.get("/pwdDecrypted/:id", async (req: Request, res: Response) => {
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

// POST
usersRouter.post("/", async (req: Request, res: Response) => {
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

usersRouter.post("/login/", async (req: Request, res: Response) => {
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

// PUT
usersRouter.put("/:id", async (req: Request, res: Response) => {
  const cResponse: CustomResponse = {
    status: "ERROR",
    message: "Unable to execute function",
    payload: undefined,
  };

  const id = req?.params?.id;

  try {
    const client = createConnection(port, host, () => {
      client.write(`ENCRYPT:${req.body.pwd}\n`);
    });

    client.on("data", async (data) => {
      req.body.updatedAt = new Date();
      const newPwd = data.toString().split(/(?:\r\n|\r|\n)/g);
      req.body.pwd = newPwd[0];
      const updatedUser: User = req.body as User;
      const query = { _id: new ObjectId(id) };

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
            message: `User with id: ${id} not updated`,
          });
    });
  } catch (e) {
    cResponse.status = "ERROR";
    cResponse.message = `Error when updating user with id ${id}`;
    cResponse.payload = e;

    if (e instanceof Error) cResponse.payload = e.message;
    res.status(400).send(cResponse);
  }
});

// DELETE
usersRouter.delete("/:id", async (req: Request, res: Response) => {
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
