// External dependencies
import { ObjectId } from "mongodb";

// Class Implementation
export default class Lives {
  constructor(
    public title: String,
    public description: String,
    public tags: String[],
    public active: Boolean,
    public personal: String,
    public url: String,
    public createdAt: Date,
    public _id?: ObjectId
  ) {}
}