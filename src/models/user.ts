// External dependencies
import { Binary, ObjectId } from "mongodb";

// Class Implementation
export default class User {
  constructor(
    public accountType: String,
    public name: String,
    public email: String,
    public pwd: String,
    public plan?: String,
    // public profilePic?: Binary,
    public degree?: String,
    // public degreePic?: Binary,
    public description?: String,
    public personalId?: String,
    public personalSubs?: String[],
    public personalFlw?: String[],
    public subscribers?: String[],
    public followers?: String[],
    public createdAt?: Date,
    public updatedAt?: Date,
    public _id?: ObjectId
  ) {}
}
