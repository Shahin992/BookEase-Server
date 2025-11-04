import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createError } from '../../../Utils/middleware/error';
import { User } from './user.model';
import mongoose from 'mongoose';

const userSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signup = async (req: Request, res: Response, next: NextFunction) => {

  try {
  
    const parsed = userSchema.parse(req.body);

  
    const existingUser = await User.findOne({ email: parsed.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: 'Email already in use',
      });
    }

    const user = new User(parsed);
    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: userWithoutPassword,
    });

  } catch (error: any) {
    if (error?.issues) {
      const formattedErrors = error.issues.map((issue: any) => ({
        field: issue.path[0],
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        errors: formattedErrors,
      });
    }

    if (error instanceof mongoose.Error || error.code === 11000) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: 'Email already exists',
      });
    }

   console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to create user',
      details: error.message || error,
    });
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = signinSchema.parse(req.body);

     const user = await User.findOne({ email: parsed.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(parsed.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Invalid credentials',
      });
    }

   const token = jwt.sign(
  { id: user._id, role: user.role, email: user.email },
  process.env.JWT_SECRET || 'secretKeyBookEase',
  { expiresIn: '1h' }
);

    const { _id, fullName, email, userId } = user;
    const userResponse = { _id, fullName, email, userId, token };

     res.cookie('book_ease_token', `Bearer ${token}`, {
      httpOnly: true,        
      secure: false, 
      sameSite: 'lax',   
      maxAge: 60 * 60 * 1000 
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Signin successful',
      data: userResponse,
    });


  } catch (error: any) {
     if (error?.issues) {
      const formattedErrors = error.issues.map((issue: any) => ({
        field: issue.path[0],
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        errors: formattedErrors,
      });
    }

   console.error('Signin error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to sign in',
      details: error.message,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // If token stored in cookies, clear cookie
     res.clearCookie('token'); 

    // Respond success
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to logout',
      details: error.message,
    });
  }
};
