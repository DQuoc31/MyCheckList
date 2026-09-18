import mongoose, { Schema, model, Document } from 'mongoose';
import { ITask, IChecklistItem } from '@mychecklist/shared';

export interface ITaskDocument extends Omit<ITask, '_id' | 'id'>, Document {}

const ChecklistItemSchema = new Schema<IChecklistItem>({
  id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  dueDate: { type: String }
}, { _id: false });

const TaskSchema = new Schema<ITaskDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
      default: 'MEDIUM' 
    },
    status: { 
      type: String, 
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'], 
      default: 'TODO' 
    },
    tags: [{ type: String, trim: true }],
    dueDate: { type: String },
    estimatedMinutes: { type: Number, default: 30 },
    checklist: [ChecklistItemSchema]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const TaskModel = model<ITaskDocument>('Task', TaskSchema);
