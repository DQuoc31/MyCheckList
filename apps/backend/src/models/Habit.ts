import { Schema, model, Document } from 'mongoose';
import { IHabitTracker, IHabitLogEntry } from '@mychecklist/shared';

export interface IHabitDocument extends Omit<IHabitTracker, '_id' | 'id'>, Document {}

const HabitLogEntrySchema = new Schema<IHabitLogEntry>(
  {
    date: { type: String, required: true }, // Format YYYY-MM-DD
    value: { type: Number, required: true, default: 0 }
  },
  { _id: false }
);

const HabitSchema = new Schema<IHabitDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    icon: { type: String, default: 'sparkles' },
    color: { type: String, default: '#6366f1' },
    unit: { type: String, required: true, trim: true, default: 'lần' },
    dailyTarget: { type: Number, required: true, default: 1 },
    quickOptions: [{ type: Number }],
    history: [HabitLogEntrySchema]
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

export const HabitModel = model<IHabitDocument>('Habit', HabitSchema);
