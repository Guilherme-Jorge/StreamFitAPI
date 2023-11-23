// External dependencies
import { ObjectId } from "mongodb";

// Class Implementation
export default class Message {
  constructor(
    public sendId: String,
    public recieveId: String,
    public message: String,
    public sentAt: Date,
    public _id?: ObjectId
  ) {}
}
