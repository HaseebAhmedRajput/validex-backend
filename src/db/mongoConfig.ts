import mongoose from "mongoose";
import { error, log } from "node:console";

const connectDB  = async(): Promise<void> =>{
    let MongoURI = process.env.MONGODB_URI;
    let MongoAtlasURI = process.env.MONGODB_ATLAS_URI ;
  
    
    let DbName= process.env.DB_NAME
    //have to change the uri with atlas
    if(!MongoURI || !DbName){ throw new Error(" There is an issue in readding env variable !")}
   try {
    
    const connectionInstance = await mongoose.connect(`${MongoAtlasURI}`,{dbName:DbName});  
    //  const connectionInstance = await mongoose.connect(`${MongoURI}/${DbName}?replicaSet=rs0`)
     console.log(`Database is connected to the host :`, connectionInstance.connection.host);
     
   } catch (error: any) {
    console.log(` Connecttion Failed Due To :` ,error.message);
    process.exit(1)
   }

}

export default connectDB