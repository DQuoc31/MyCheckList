import mongoose, { Schema, model, Document } from 'mongoose';
import { IUser } from '@mychecklist/shared';

export interface IUserDocument extends Omit<IUser, '_id' | 'id'>, Document {
  password: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const UserModel = model<IUserDocument>('User', UserSchema);
