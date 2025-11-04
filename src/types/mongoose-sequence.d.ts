declare module 'mongoose-sequence' {
  import { Mongoose } from 'mongoose';

  interface AutoIncrementOptions {
    id?: string;
    inc_field: string;
    reference_fields?: string[];
    start_seq?: number;
  }

  export default function AutoIncrementFactory(mongoose: Mongoose): (
    schema: any,
    options?: AutoIncrementOptions
  ) => void;
}