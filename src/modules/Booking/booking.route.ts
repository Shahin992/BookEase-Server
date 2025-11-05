import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/authMiddlewares';
import { cancelBooking, checkBookingConflict, createBooking, getUserBookings, updateBookingDates, 
    //  getUserBookings, 
    //  getAllBookings, returnCar
 } from './booking.controller';

const router = Router();

router.post('/service-availability', checkBookingConflict)
router.post('/', createBooking); 
 router.post('/my-bookings', getUserBookings); 
 router.put('/update-dates', updateBookingDates);
 router.patch('/cancel-booking', cancelBooking)
// router.get('/', authenticate, authorize(['admin']), getAllBookings); 
// router.put('/return', authenticate, authorize(['admin']), returnCar); 

export default router;
