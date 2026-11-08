import mongoose,{Schema} from "mongoose";
import { required } from "zod/mini";

const LiveTimerSchema= new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true
    }
,
testId:{
     type: Schema.Types.ObjectId,
        ref: "Test",
        required:true
},
expireAt:{
    type:Date, required:true
}
},{timestamps:true})

// LiveTimerSchema.index({studentId:1},{expireAfterSeconds:0})

LiveTimerSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

LiveTimerSchema.index({studentId:1, testId:1},{unique:true})

export const LiveTimer = mongoose.model("Livetimer",LiveTimerSchema)