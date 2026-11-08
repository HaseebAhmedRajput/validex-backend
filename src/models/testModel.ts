import mongoose, { Schema, Document, Types } from "mongoose";
import type { createTestScehma } from "../schemas/testSchema.js";
import { string } from "zod";

export interface Itest extends  createTestScehma, Document{ 
 
  createdBy: Types.ObjectId;
  testCode:Number
  // questions: Types.ObjectId[];
 
}

const testSchema = new Schema<Itest>(
  {
    title: { type: String, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectCode:{
      type:String,
      required:true
    }
    ,
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
        default:[]
      },
    ],
    isCameraMonitoring:{
      type:Boolean,
      default:false
    },


    // duration: { type: Number, required: true },
    totalMarks: { type: Number },
    testCode: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    allowedLocation: {
      lat: { type: Number, required: true }, 
      lng: { type: Number, required: true },
      radius:{ type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export const Test = mongoose.model<Itest>("Test", testSchema);