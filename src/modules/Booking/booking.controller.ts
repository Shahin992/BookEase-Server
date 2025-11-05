
import { Request, Response } from 'express';
import { Services } from '../Services/services.model';
import { Booking } from './booking.model';
import { formatZodError } from '../Services/services.controller';
import { bookingSchema,} from '../../../Utils/ErrorValidation';
import mongoose from 'mongoose';
import { User } from '../User/user.model';


interface CreateBookingRequest {
  serviceId: string;       // Service _id
  checkInDate: string;     // ISO date string
  checkOutDate: string;    // ISO date string
  totalGuests: number;
  _id: string
}

export const checkBookingConflict = async (req: Request, res: Response) => {
  try {
    const { serviceId, checkInDate, checkOutDate } = req.body;

    if (!serviceId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Missing required fields: serviceId, checkInDate, checkOutDate",
        data: [],
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const conflictingBooking = await Booking.findOne({
      service: serviceId,
      bookingStatus: { $in: ["Upcoming", "Paid"] },
      $or: [
        { checkInDate: { $lte: checkOut }, checkOutDate: { $gte: checkIn } },
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: "This service is already booked for the selected dates",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "No booking conflicts for selected dates",
      data: [],
    });
  } catch (error: any) {
    console.error("Error checking booking conflict:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message,
      data: [],
    });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const parsed = req.body as CreateBookingRequest;

    const service = await Services.findById(parsed.serviceId);
    if (!service || !service.available) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Service not found or not available",
        data: [],
      });
    }

     const checkIn = new Date(parsed.checkInDate);
    const checkOut = new Date(parsed.checkOutDate);

    
    const totalDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000*60*60*24));
    const totalPrice = service.price * totalDays;

   // Generate bookingId
    const lastBooking = await Booking.findOne().sort({ createdAt: -1 });
    const lastIdNumber = lastBooking
      ? parseInt(lastBooking.bookingId.split("-")[2])
      : 0;
    const bookingId = `BK-${new Date().getFullYear()}-${String(
      lastIdNumber + 1
    ).padStart(3, "0")}`;

    const booking = new Booking({
      bookingId,
      user: parsed._id,
      service: parsed.serviceId,
      bookingDate: new Date(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalDays,
      totalGuests: parsed.totalGuests,
      totalPrice,
      paymentStatus: "Paid",
      bookingStatus: "Upcoming",
    });

    await booking.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Booking created successfully",
      data: booking,
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).body.userId; // receive payload from frontend
   
    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized: User not authenticated",
        data: [],
      });
    }

    // Fetch bookings for the user
    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "service",
        model: Services, // ensure Service model is passed
        select: "title type location price image available badge",
      })
      .populate({
        path: "user",
        model: User,
        select: "name email",
      })
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        statusCode: 200,
        message: "No bookings found for this user",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User bookings retrieved successfully",
      data: bookings,
    });
  } catch (error: any) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      data: [],
    });
  }
};

export const updateBookingDates = async (req: Request, res: Response) => {
  try {
    const { bookingId, checkInDate, checkOutDate } = req.body;

    // 🔸 Validate required fields
    if (!bookingId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Missing required fields: bookingId, checkInDate, checkOutDate",
        data: [],
      });
    }

    // 🔸 Find the existing booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Booking not found",
        data: [],
      });
    }

    // 🔸 Convert to Date objects
    const newCheckIn = new Date(checkInDate);
    const newCheckOut = new Date(checkOutDate);

    // 🔸 Check for conflicting bookings (excluding the current booking)
    const conflictingBooking = await Booking.findOne({
      service: booking.service,
      _id: { $ne: bookingId }, // exclude current booking
      bookingStatus: { $in: ["Upcoming", "Paid"] },
      $or: [
        { checkInDate: { $lte: newCheckOut }, checkOutDate: { $gte: newCheckIn } },
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: "This service is already booked for the selected dates",
        data: [],
      });
    }

    // 🔸 Calculate new totalDays and totalPrice
    const service = await Services.findById(booking.service);
    if (!service) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Service not found",
        data: [],
      });
    }

    const totalDays = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = service.price * totalDays;

    // 🔸 Update booking
    booking.checkInDate = newCheckIn;
    booking.checkOutDate = newCheckOut;
    booking.totalDays = totalDays;
    booking.totalPrice = totalPrice;

    await booking.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Booking dates updated successfully",
      data: booking,
    });

  } catch (error: any) {
    console.error("Error updating booking dates:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message,
      data: [],
    });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    // 🔸 Validate input
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Missing required field: bookingId",
        data: [],
      });
    }

    // 🔸 Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Booking not found",
        data: [],
      });
    }

    // 🔸 If already cancelled
    if (booking.bookingStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Booking is already cancelled",
        data: [],
      });
    }

    // 🔸 Update booking status
    booking.bookingStatus = "Cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Booking cancelled successfully",
      data: booking,
    });

  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server Error",
      data: [],
    });
  }
};


// export const createBooking = async (req: Request, res: Response) => {
//   try {
//     // const parsed = bookingSchema.parse(req.body);
//     const parsed = req.body as CreateBookingRequest;

//     // ✅ Validate that service exists and is available
//     const service = await Services.findById(parsed.serviceId);
//     if (!service || !service.available) {
//       return res.status(404).json({
//         success: false,
//         statusCode: 404,
//         message: "Service not found or not available",
//         data: [],
//       });
//     }

//     // Calculate total days
//     const checkIn = new Date(parsed.checkInDate);
//     const checkOut = new Date(parsed.checkOutDate);
//     const totalDays = Math.ceil(
//       Math.abs(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
//     );
//     const totalPrice = service.price * totalDays;

//     // Generate bookingId
//     const lastBooking = await Booking.findOne().sort({ createdAt: -1 });
//     const lastIdNumber = lastBooking
//       ? parseInt(lastBooking.bookingId.split("-")[2])
//       : 0;
//     const bookingId = `BK-${new Date().getFullYear()}-${String(
//       lastIdNumber + 1
//     ).padStart(3, "0")}`;

//     // Create booking
//     const booking = new Booking({
//       bookingId,
//       user: (req as any).user._id,
//       service: parsed.serviceId,
//       bookingDate: new Date(),
//       checkInDate: checkIn,
//       checkOutDate: checkOut,
//       totalDays,
//       totalGuests: parsed.totalGuests,
//       totalPrice: totalPrice,
//       paymentStatus: "Pending",
//       bookingStatus: "Upcoming",
//     });

//     await booking.save();

//     res.status(201).json({
//       success: true,
//       statusCode: 201,
//       message: "Booking created successfully",
//       data: booking,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       res.status(400).json({
//         success: false,
//         statusCode: 400,
//         message: "Validation error",
//         errors: formatZodError(error),
//       });
//     } else {
//       res.status(500).json({
//         success: false,
//         statusCode: 500,
//         message: (error as Error).message,
//       });
//     }
//   }
// };

// export const getUserBookings = async (req: Request, res: Response) => {
//     try {
//       const bookings = await Booking.find({ user: (req as any).user.id }).populate('car user');
//       if (!bookings || bookings.length === 0) {
//         return res.status(404).json({ success: false, statusCode: 404, message: "No Data Found", data: [] });
//       }
//       res.status(200).json({ success: true, statusCode: 200, message: "My Bookings retrieved successfully", data: bookings });
//     } catch (error) {
//       console.error('Error fetching user bookings:', error);
//       res.status(500).json({ success: false, statusCode: 500, message: "Internal Server Error", data: [] });
//     }
//   };

// export const getAllBookings = async (req: Request, res: Response) => {
//   try {
//     const bookings = await Booking.find({}).populate('car user');
//     if (bookings.length === 0) {
//       return res.status(404).json({ success: false, statusCode: 404, message: "No Data Found", data: [] });
//     }
//     res.status(200).json({ success: true, statusCode: 200, message: "Bookings retrieved successfully", data: bookings });
//   } catch (error) {
//     res.status(500).json({ success: false, statusCode: 500, message: (error as Error).message });
//   }
// };

// interface ReturnCarRequest extends Request {
//   body: {
//     bookingId: string;
//     endTime: string;
//   };
// }

// export const returnCar = async (req: ReturnCarRequest, res: Response) => {
//   console.log(req.body);
//   try {
//     const { bookingId, endTime } = req.body;

//     // Validate bookingId
//     if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res.status(400).json({ success: false, message: 'Invalid bookingId' });
//     }

//     // Find the booking by bookingId and populate car details
//     const booking = await Booking.findById(bookingId).populate('car').exec();

//     if (!booking || !booking.car) {
//       return res.status(404).json({ success: false, message: 'Booking not found' });
//     }

//     // Update booking details
//     booking.endTime = endTime;

//     // Calculate total cost (example calculation)
//     const start = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`);
//     const end = new Date(`${booking.date.toISOString().split('T')[0]}T${endTime}`);
//     const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
//     booking.totalCost = durationInHours * (booking.car as any).pricePerHour;

//     await booking.save();

//     // Update car status to 'available'
//     const carId = (booking.car as any)._id;
//     const car = await Car.findById(carId);
//     if (!car) {
//       return res.status(404).json({ success: false, message: 'Car not found' });
//     }
//     car.status = 'available';
//     await car.save();

//     res.status(200).json({ success: true, message: 'Car returned successfully', data: booking });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: (error as Error).message });
//   }
// };


