import mongoose,{Schema, Document} from "mongoose";
import  jwt, { type Secret }  from "jsonwebtoken";
import bcrypt from "bcrypt"

import type { userType } from "../schemas/signUpSchema.js"; // type we have defined in zod Schema for validations






export interface Iuser extends  Document {
     fullname: string,
         email:string
         number:number,
         password:string,
         role: "student" | "teacher"|"admin"|"superAdmin",
         department:string,
         batch:string,
         regNo: string ,
         isUserVerified:boolean,
         isLoggedIn:boolean,
         refreshToken: string,



  
    //Methods that can be used in  user actions
    isCorrectPassword(password:string):  Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;


}

const UserSchema = new Schema<Iuser>({
    fullname:{
        type:String,
        required:true
    },
    email:{
        type:String, required: [true,"email must  required"], unique: true
    },
    number: {
        type: Number,
        required: true,
        
    },
    password: {
        type: String, required: true
    },
    batch:{
        type:String
    },
    regNo: {type:String, default:undefined},
    role: {
        type: String,
        enum: ["student","teacher", "admin","superAdmin"],
        default: "student"
    },
    department:{type :String, required: true},
    isUserVerified:{
        type: Boolean,
        default: false
    },
 

      
}, {timestamps:true})


//to hash the password before storing it to the db
UserSchema.pre<Iuser>("save",  async function (){
  if (!this.isModified("password")) return ;

  try {
    this.password = await bcrypt.hash(this.password, 10);
  
  } catch (error: any) {
  throw new Error(`Bcrypt Hashing Failed: ${error.message}`);
  }
});

// user methods

UserSchema.methods.isCorrectPassword= async function(password:string):Promise<boolean>{
    return await bcrypt.compare(password,this.password)
}

UserSchema.methods.generateAccessToken=function(this: Iuser): string{
    if (!process.env.ACCESS_TOKEN_SECRET){
        throw new Error ("Access Token SECRET Is Missing !")
    }

    let accessToken = jwt.sign({
        _id: this._id,
        email:this.email
    }, 
     process.env.ACCESS_TOKEN_SECRET,
     {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY as any || "1h"
    }) 
    return accessToken

}

UserSchema.methods.generateRefreshToken=  function(this:Iuser):string{
    if(!process.env.REFRESH_TOKEN_SECRET){throw new Error (" Refresh Token SECRET is Missing!")}
    let refreshToken =  jwt.sign({
        _id:this._id,
        email:this.email
    } ,
    process.env.REFRESH_TOKEN_SECRET as Secret
    ,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY as any || "1d"
    })

    return refreshToken
}
UserSchema.index(
  { regNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "student",
      regNo: { $type: "string" },
    },
  }
);
export const User = mongoose.model<Iuser>("User",UserSchema)




