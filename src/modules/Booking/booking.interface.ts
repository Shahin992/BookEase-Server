import { Schema } from "mongoose";


export interface IBooking extends Document {
  bookingId: string;
  user: Schema.Types.ObjectId;          // Linked to User _id
  service: Schema.Types.ObjectId;       // Linked to Service _id
  bookingDate: Date;
  checkInDate: Date;
  checkOutDate: Date;
  totalDays: number;
  totalGuests: number;
  totalPrice: number;
  paymentStatus: "Pending" | "Paid" | "Cancelled";
  bookingStatus: "Upcoming" | "Completed" | "Cancelled";
}
