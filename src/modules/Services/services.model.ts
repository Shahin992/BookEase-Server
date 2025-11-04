import { Schema, model, Document } from 'mongoose';
import { IService } from './services.interface';


// Service schema
const serviceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['Resort', 'Vehicle', 'Conference Hall'], required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    available: { type: Boolean, default: true },
    badge: { type: String }
  },
  { timestamps: true, versionKey: false }
);

// Export model
export const Services = model<IService>('book_Ease_Services', serviceSchema);
