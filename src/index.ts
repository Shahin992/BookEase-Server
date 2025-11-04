import { Request, Response } from "express";
import authRoutes from '../src/modules/User/user.route'
import servicesRoutes from './modules/Services/services.route'
import bookingRoutes from '../src/modules/Booking/booking.route'
import { authenticate } from '../middleware/authMiddlewares'
import cookieParser from 'cookie-parser';
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv')

dotenv.config()
const cors = require('cors');
const PORT = process.env.PORT || 8000;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: ["http://localhost:5173", "https://book-ease-delta.vercel.app/"],
        credentials: true
    })
);

// Database connection
main().catch(err => console.log(err));

async function main() {
    try {
        mongoose.set('strictPopulate', false);
        await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.c60ctk1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`);
        console.log("====> Connected to DB", mongoose.connection.name);
    } catch (error) {
        console.log(error);
    }
}



app.use('/api/auth', authRoutes);
app.use('/api/services',servicesRoutes);
app.use('/api/bookings',bookingRoutes);


app.get('/', (req:Request, res:Response) => {
    res.send('BookEase Server is Running')
  })

app.listen(PORT, () => {
    console.log('====> Server running on', PORT);
});