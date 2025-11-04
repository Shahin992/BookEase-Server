import { Document } from "mongoose";

export interface IService extends Document {
  title: string;
  type: 'Resort' | 'Vehicle' | 'Conference Hall';
  location: string;
  price: number;
  image: string;
  available: boolean;
  badge?: string;
}