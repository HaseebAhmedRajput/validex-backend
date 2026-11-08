import { number, string, z } from "zod";

export let signUpSchema= z.object({

fullname: z.string().min(2, "Name must be atleast more then two characters").transform((val) => val.toUpperCase()),
    email:z.string().email("Invalid Email Address"),
    number:z.number().int("Number must be legal and positive "),
    password:z.string().min(8, "Password must be more then Eight Characters"),
    role:z.enum(["student","teacher"]),
    department: z.string().min(1,"Department Is compulsory"),
    batch:z.string().optional(),
    regNo :z.string().optional(),
    isUserVerified:z.boolean().default(false),
    isLoggedIn:z.boolean().default(false),
    refreshToken: z.string().nullable().default(null)
   

})
   
     
    


export type userType = z.infer<typeof signUpSchema>

