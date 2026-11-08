import z, { email } from "zod"



 const signInSchema = z.object({
     email:z.email("Must be a valid email address"),
     password:z.string().min(8, "Password Must be  eight characters long")
})

 const startTestSchema = z.object({
     email:z.email("Must be a valid email"),
     password:z.string().min(8,"Password must be string"),
     testCode: z.number().min(5,"code must be 5 digits")
})
 const resetPasswordScehma = z.object({
     email:z.email("Must be a valid email"),
     newPassword:z.string().min(8,"Password must be string"),
     otp: z.number().min(5,"code must be 5 digits")
})

const verifyCodeSchema=  z.number().min(5,"Verification Code Must be atleast 5 Digits")



export {
     startTestSchema, signInSchema,verifyCodeSchema,resetPasswordScehma
}
