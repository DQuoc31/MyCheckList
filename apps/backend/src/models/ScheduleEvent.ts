import { Schema, model, Document } from 'mongoose';
import { IScheduleEvent } from '@mychecklist/shared';

export interface IScheduleEventDocument extends Omit<IScheduleEvent, '_id' | 'id'>, Document {}

const ScheduleEventSchema = new Schema<IScheduleEventDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    color: { type: String, default: '#6366f1' },
    category: {
      type: String,
      enum: ['WORK', 'PERSONAL', 'STUDY', 'HEALTH', 'MEETING'],
      default: 'WORK'
    },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY']
    }
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

export const ScheduleEventModel = model<IScheduleEventDocument>('ScheduleEvent', ScheduleEventSchema);
