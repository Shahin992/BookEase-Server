import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/authMiddlewares';
import { createBooking, 
    //  getUserBookings, 
    //  getAllBookings, returnCar
 } from './booking.controller';

const router = Router();

router.post('/', createBooking); 
// router.get('/my-bookings', authenticate, authorize(['user']), getUserBookings); 
// router.get('/', authenticate, authorize(['admin']), getAllBookings); 
// router.put('/return', authenticate, authorize(['admin']), returnCar); 

export default router;
