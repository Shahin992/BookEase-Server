import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/authMiddlewares';
import { 
    // createCar, deleteCar,
     getAllServices, getServiceById, 
    //  updateCar
     } from './services.controller';
// import { createCar, getAllCars, getCarById, updateCar, deleteCar } from '../controllers/carController';
// import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// router.post('/', authenticate, authorize(['admin']), createCar);
router.get('/', getAllServices);
router.get('/:id', getServiceById);
// router.put('/:id', authenticate, authorize(['admin']), updateCar);
// router.delete('/:id', authenticate, authorize(['admin']), deleteCar);

export default router;
