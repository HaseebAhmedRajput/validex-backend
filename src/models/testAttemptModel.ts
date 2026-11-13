import mongoose, { Document, Schema, Types } from "mongoose";
import type { attemptType } from "../schemas/testAttemptScehma.js";

interface IAttempt extends Document, attemptType {
  testId: Types.ObjectId;
  studentId: Types.ObjectId;
  obtainedMarks: number;
  totalMarks: number;
  violation:number
}

const attemptScehma = new Schema<IAttempt>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mcqsAns: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        selectedOption: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },
         obtainedMarks:{
          type:Number,
          default:0,
          min:0,
          max:50
         },
         isCorrect:{
              type:Boolean,
              default:false
                 },
                 status:{
                  type:String,
                  enum:["graded","pending"], default:"pending"
                 }
      },
    ],
    theoreticalAns: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
        },
        ans: {
          type: String,
            },
           obtainedMarks:{
          type:Number,
          default:0,
          min:0,
          max:100
         },
         feedback:{
          type:String,

         },
         status:{
                  type:String,
                  enum:["graded","pending"], default:"pending"
                 }
      },
    ],
    startTime: { type: Date, required: true },
    submitTime: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    violation:{
      type:Number,
       default:0
    }
  },
  { timestamps: true },
);

attemptScehma.index({testId:1,studentId:1},{unique:true})

export const  Attempt =mongoose.model<IAttempt>("Attempt",attemptScehma)