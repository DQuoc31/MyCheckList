import { Schema, model, Document } from 'mongoose';
import { ITransaction } from '@mychecklist/shared';

export interface ITransactionDocument extends Omit<ITransaction, '_id' | 'id'>, Document {}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { 
      type: String, 
      enum: ['EXPENSE', 'INCOME'], 
      required: true, 
      default: 'EXPENSE' 
    },
    category: { type: String, required: true, trim: true, default: 'Khác' },
    timeSlot: { 
      type: String, 
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'], 
      required: true, 
      default: 'MORNING' 
    },
    date: { type: String, required: true, index: true }, // Format YYYY-MM-DD
    time: { type: String, default: '' }, // Format HH:mm
    note: { type: String, default: '' }
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

// Compound index for efficient queries by user, date, and time slot
TransactionSchema.index({ userId: 1, date: 1, timeSlot: 1 });

export const TransactionModel = model<ITransactionDocument>('Transaction', TransactionSchema);
