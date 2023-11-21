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
  try {
    const users = (await collections
      .users!.find({})
      .toArray()) as unknown as User[];

    res.status(200).send(users);
  } catch (e) {
    if (e instanceof Error) res.status(500).send(e.message);
  }
});

usersRouter.get("/user/:id", async (req: Request, res: Response) => {
  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const user = (await collections.users!.findOne(query)) as unknown as User;

    if (user) {
      res.status(200).send(user);
    }
  } catch (e) {
    res
      .status(404)
      .send(`Unable to find matching document with id: ${req.params.id}`);
  }
});

usersRouter.get("/login/", async (req: Request, res: Response) => {
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
        res.status(200).send({ id: user._id });
      }
    });
  } catch (e) {
    res
      .status(404)
      .send(`Unable to find matching user with email: ${req.params.email}`);
  }
});

usersRouter.get("/pwdDecrypted/:id", async (req: Request, res: Response) => {
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
        res.status(200).send(user);
      }
    });
  } catch (e) {
    res
      .status(404)
      .send(`Unable to find matching document with id: ${req.params.id}`);
  }
});

// POST
usersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const client = createConnection(port, host, () => {
      client.write(`ENCRYPT:${req.body.pwd}\n`);
    });

    client.on("data", async (data) => {
      const newPwd = data.toString().split(/(?:\r\n|\r|\n)/g);
      req.body.pwd = newPwd[0];

      req.body.createdAt = new Date();
      req.body.updatedAt = new Date();

      const newUser = req.body as User;
      const result = await collections.users!.insertOne(newUser);

      client.write("exit\n");

      result
        ? res
            .status(201)
            .send(
              `Successfully created a new user with id ${result.insertedId}`
            )
        : res.status(500).send("Failed to create a new user.");
    });
  } catch (e) {
    console.error(e);
    if (e instanceof Error) res.status(400).send(e.message);
  }
});

// PUT
usersRouter.put("/:id", async (req: Request, res: Response) => {
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
        ? res.status(200).send(`Successfully updated user with id ${id}`)
        : res.status(304).send(`User with id: ${id} not updated`);
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(400).send(e.message);
    }
  }
});

// DELETE
usersRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = req?.params?.id;

  try {
    const query = { _id: new ObjectId(id) };
    const result = await collections.users!.deleteOne(query);

    if (result && result.deletedCount) {
      res.status(202).send(`Successfully removed user with id ${id}`);
    } else if (!result) {
      res.status(400).send(`Failed to remove user with id ${id}`);
    } else if (!result.deletedCount) {
      res.status(404).send(`User with id ${id} does not exist`);
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(400).send(e.message);
    }
  }
});
