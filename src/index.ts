import dotenv from "dotenv"
dotenv.config({
  path: "./.env",
});

import  app  from "./app.js"
import connectDB from "./db/mongoConfig.js";
import { initAutoSubmitWorker } from "./utills/testAutoSubmit.js";

const port = process.env.PORT ||4000
connectDB()
.then(()=>{
  app.listen(port,async ()=>{
    console.log(`App in running on port :`,port);
     initAutoSubmitWorker()
  })

})
.catch((error:any)=>{
    console.error(`Failed to listen the app :`, error);
    process.exit(1)
    
})

