// External dependencies
import { ObjectId } from "mongodb";

// Class Implementation
export default class User {
  constructor(
    public _id: ObjectId,
    public accountType: String,
    public name: String,
    public email: String,
    public pwd: String,
    public plan: String,
    // public profilePic?: ,
    public degree?: String,
    // public degreePic?: ,
    public description?: String,
    public personalId?: String,
    // public personalSubs?: String[],
    // public personalFlw?: String[],
    // public subscribers?: String[],
    // public followers?: String[],
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}
