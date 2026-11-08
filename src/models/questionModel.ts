import mongoose,{Schema,Types,Document} from "mongoose";
import type { QuestionType } from "../schemas/questionsSchema.js";


export interface IQuestion extends QuestionType,Document{
    testId:Types.ObjectId
}

const questionSchema= new Schema<IQuestion>({
  testId:{
    type:Schema.Types.ObjectId,
    ref:"Test",
    required:true
  },
  questionType:{
    type:String,
    enum:["mcq","theory"],
    required:true,
    default:"mcq"
  },
  questionText:{
type:String,
required:true
  },
  options:{
    type:[String],
   
  },
  correctOption:{
    type:Number, 
  },
  marks:{
    type:Number, required:true, default:1
  }
})


export const Question =  mongoose.model<IQuestion>("Question",questionSchema)