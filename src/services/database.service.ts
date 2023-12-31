// External Dependencies
import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

// Global Variables
export const collections: {
  users?: mongoDB.Collection;
  messages?: mongoDB.Collection;
  lives?: mongoDB.Collection;
} = {};

// Initialize Connection
export async function connectToDatabase() {
  dotenv.config();

  const client: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.DB_CONN_STRING!
  );

  await client.connect();

  const db: mongoDB.Db = client.db(process.env.DB_NAME);

  await db.command({
    collMod: process.env.USERS_COLLECTION_NAME,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["accountType", "name", "email", "pwd"],
        additionalProperties: false,
        properties: {
          _id: {},
          accountType: {
            enum: ["aluno", "personal"],
            bsonType: "string",
            description:
              "'accountType' is required and must be one of the listed options",
          },
          name: {
            bsonType: "string",
            description: "'name' is required and is a string",
          },
          email: {
            bsonType: "string",
            description: "'email' is required and is a string",
          },
          pwd: {
            bsonType: "string",
            description: "'pwd' is required and is a string",
          },
          plan: {
            bsonType: "string",
            description: "'plan' is optional and is a string",
          },
          // profilePic: {
          //   bsonType: "binData",
          //   description: "'profilePic' is optional and is binary",
          // },
          degree: {
            bsonType: "string",
            description: "'degree' is optional and is a string",
          },
          // degreePic: {
          //   bsonType: "binData",
          //   description: "'degreePic' is optional and is binary",
          // },
          description: {
            bsonType: "string",
            description: "'description' is optional and is a string",
          },
          personalId: {
            bsonType: "string",
            description: "'personalId' is optional and is a string",
          },
          personalSubs: {
            bsonType: "array",
            description: "'personalSubs' is optional and is an array",
          },
          personalFlw: {
            bsonType: "array",
            description: "'personalFlw' is optional and is an array",
          },
          subscribers: {
            bsonType: "array",
            description: "'subscribers' is optional and is an array",
          },
          followers: {
            bsonType: "array",
            description: "'followers' is optional and is an array",
          },
          createdAt: {
            bsonType: "date",
            description: "'createdAt' is optional and is a date",
          },
          updatedAt: {
            bsonType: "date",
            description: "'updatedAt' is optional and is a date",
          },
        },
      },
    },
  });

  const usersCollection: mongoDB.Collection = db.collection(
    process.env.USERS_COLLECTION_NAME!
  );

  collections.users = usersCollection;

  await db.command({
    collMod: process.env.MESSAGES_COLLECTION_NAME,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["sendId", "recieveId", "message"],
        additionalProperties: false,
        properties: {
          _id: {},
          sendId: {
            bsonType: "string",
            description: "'sendId' is required and is a string",
          },
          recieveId: {
            bsonType: "string",
            description: "'recieveId' is required and is a string",
          },
          message: {
            bsonType: "string",
            description: "'message' is required and is a string",
          },
          sentAt: {
            bsonType: "date",
            description: "'sentAt' is optional and is a date",
          },
        },
      },
    },
  });

  const messagesCollection: mongoDB.Collection = db.collection(
    process.env.MESSAGES_COLLECTION_NAME!
  );

  collections.messages = messagesCollection;

  await db.command({
    collMod: process.env.LIVES_COLLECTION_NAME,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["title", "active", "personal", "url"],
        additionalProperties: false,
        properties: {
          _id: {},
          title: {
            bsonType: "string",
            description: "'title' is required and is a string",
          },
          description: {
            bsonType: "string",
            description: "'description' is optional and is a string",
          },
          tags: {
            bsonType: "array",
            description: "'tags' is optional and is an array",
          },
          active: {
            bsonType: "bool",
            description: "'active' is required and is a boolean",
          },
          personal: {
            bsonType: "string",
            description: "'personal' is required and is a string",
          },
          url: {
            bsonType: "string",
            description: "'url' is required and is a string",
          },
          createdAt: {
            bsonType: "date",
            description: "'createdAt' is optional and is a date",
          },
        },
      },
    },
  });

  const livesCollection: mongoDB.Collection = db.collection(
    process.env.LIVES_COLLECTION_NAME!
  );

  collections.lives = livesCollection;

  console.log(
    `Successfully connected to database: ${db.databaseName} and collections: ${usersCollection.collectionName}, ${messagesCollection.collectionName}, ${livesCollection.collectionName}`
  );
}
