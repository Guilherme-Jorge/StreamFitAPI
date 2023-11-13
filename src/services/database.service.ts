// External Dependencies
import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

// Global Variables
export const collections: { users?: mongoDB.Collection } = {};

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
        required: ["accountType", "name", "email", "pwd", "plan"],
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
            description: "'plan' is required and is a string",
          },
          // profilePic: {
          //   bsonType: "",
          //   description: "'profilePic' is optional and is a ",
          // },
          degree: {
            bsonType: "string",
            description: "'degree' is optional and is a string",
          },
          // degreePic: {
          //   bsonType: "",
          //   description: "'degreePic' is optional and is a ",
          // },
          description: {
            bsonType: "string",
            description: "'description' is optional and is a string",
          },
          personalId: {
            bsonType: "string",
            description: "'personalId' is optional and is a string",
          },
          // personalSubs: {
          //   bsonType: "array",
          //   description: "'personalSubs' is optional and is an array",
          // },
          // personalFlw: {
          //   bsonType: "array",
          //   description: "'personalFlw' is optional and is an array",
          // },
          // subscribers: {
          //   bsonType: "array",
          //   description: "'subscribers' is optional and is an array",
          // },
          // followers: {
          //   bsonType: "array",
          //   description: "'followers' is optional and is an array",
          // },
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

  console.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${usersCollection.collectionName}`
  );
}
