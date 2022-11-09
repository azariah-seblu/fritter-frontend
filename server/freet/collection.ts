import type {HydratedDocument, Types} from 'mongoose';
import type {Freet} from './model';
import FreetModel from './model';
import UserCollection from '../user/collection';
import { constructUserResponse } from '../user/util';
import UserModel from '../user/model';

export enum VisionEnum {
  DRAFT=0,
  ANONYMOUS=1,
  PRIVATE=2,
  PUBLIC=3,
}
/**
 * This files contains a class that has the functionality to explore freets
 * stored in MongoDB, including adding, finding, updating, and deleting freets.
 * Feel free to add additional operations in this file.
 *
 * Note: HydratedDocument<Freet> is the output of the FreetModel() constructor,
 * and contains all the information in Freet. https://mongoosejs.com/docs/typescript.html
 */
class FreetCollection {
  /**
   * Add a freet to the collection
   *
   * @param {string} authorId - The id of the author of the freet
   * @param {string} content - The id of the content of the freet
   * @param {Enumerator}
   * @return {Promise<HydratedDocument<Freet>>} - The newly created freet
   */
  static async addOne(authorId: Types.ObjectId | string, content: string, vision: number): Promise<HydratedDocument<Freet>> {
    const date = new Date();
    const reps = new Map()
    const freet = new FreetModel({
      authorId,
      dateCreated: date,
      vision,
      content,
      dateModified: date,
      replies: reps
    });
    await freet.save(); // Saves freet to MongoDB
    return freet.populate('authorId');
  }

  /**
   * Find a freet by freetId
   *
   * @param {string} freetId - The id of the freet to find
   * @return {Promise<HydratedDocument<Freet>> | Promise<null> } - The freet with the given freetId, if any
   */
  static async findOne(freetId: Types.ObjectId | string): Promise<HydratedDocument<Freet>> {
    return FreetModel.findOne({_id: freetId}).populate('authorId');
  }

  /**
   * Get all the freets in the database
   *
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAll(userId?: Types.ObjectId | string): Promise<Array<HydratedDocument<Freet>>> {
    // Retrieves freets and sorts them from most to least recent
    if (userId){
      const user = await UserCollection.findOneByUserId(userId)
      const userstring = user.username as string
      const friendsUsernames = user.friends
      var friendsUsers = []
      for (const term of friendsUsernames){
        friendsUsers.push(await UserCollection.findOneByUsername(term))
      }
      var friendsIds=[]
      for (const item of friendsUsers){
        if (item){
          friendsIds.push(item._id)
        }
      }
      friendsIds.push(userId)
      return FreetModel.find({
        $or:[
          {vision: 3},
          {$and:[
            {vision: 2},
            {$or:[
              // {authorId: userstring},
              {authorId: {$in: friendsIds}}
            ]}
          ]},
          {vision: 1},
        ]
      }).sort({dateModified: -1}).populate('authorId');
    } else{
      return FreetModel.find({
          $or:[
            {vision: 3},
            {vision: 1}
          ]
      }).sort({dateModified: -1}).populate('authorId');
    }
  }

  /**
   * Get all the freets in by given author
   *
   * @param {string} username - The username of author of the freets
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAllByUsername(username: string, userId?: Types.ObjectId | string): Promise<Array<HydratedDocument<Freet>>> {
    const author = await UserCollection.findOneByUsername(username);
    if (userId){
      const user = await UserCollection.findOneByUserId(userId)
      const friendsUsernames = user.friends
      var friendsUsers = []
      for (const term of friendsUsernames){
        friendsUsers.push(await UserCollection.findOneByUsername(term))
      }
      var friendsIds=[]
      for (const item of friendsUsers){
        if (item){
          friendsIds.push(item._id)
        }
      }
      return FreetModel.find({
        $and:[
          {authorId: author._id},
          {
            $or:[
              {vision: 3},
              {$and:[
                {vision: 2},
                {authorId: {$in: friendsIds}}
              ]},
              {vision: 1},
            ]
          }
        ]
      }).populate('authorId');
    }else{
      return FreetModel.find({
        $and:[
          {authorId: author._id},
          {vision: 3}
        ]
      }).populate('authorId');
    }
  }

  /**
   * Update a freet with the new content
   *
   * @param {string} freetId - The id of the freet to be updated
   * @param {string} content - The new content of the freet
   * @return {Promise<HydratedDocument<Freet>>} - The newly updated freet
   */
  static async updateOne(freetId: Types.ObjectId | string, content: string, userId: string): Promise<HydratedDocument<Freet>> {
    const freet = await FreetModel.findOne({_id: freetId});
    const user = await UserCollection.findOneByUserId(userId);
    const username = user.username
    freet.replies.set(username,content)
    await freet.save();
    return freet.populate('authorId');
  }

  /**
   * Delete a freet with given freetId.
   *
   * @param {string} freetId - The freetId of freet to delete
   * @return {Promise<Boolean>} - true if the freet has been deleted, false otherwise
   */
  static async deleteOne(freetId: Types.ObjectId | string): Promise<boolean> {
    const freet = await FreetModel.deleteOne({_id: freetId});
    return freet !== null;
  }

  /**
   * Delete all the freets by the given author
   *
   * @param {string} authorId - The id of author of freets
   */
  static async deleteMany(authorId: Types.ObjectId | string): Promise<void> {
    await FreetModel.deleteMany({authorId});
  }
}

export default FreetCollection;
