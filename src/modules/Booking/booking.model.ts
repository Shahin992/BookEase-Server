import { Schema, model, Document } from "mongoose";
import { IBooking } from "./booking.interface";



const bookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "book_Ease_User", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    bookingDate: { type: Date, default: Date.now },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    totalGuests: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Cancelled"],
      default: "Paid",
    },
    bookingStatus: {
      type: String,
      enum: ["Upcoming", "Completed", "Cancelled"],
      default: "Upcoming",
    },
  },
  { timestamps: true, versionKey: false }
);

export const Booking = model<IBooking>("book_ease_booking", bookingSchema);
