import z from "zod"


export const tesAttemptSchema= z.object({
    mcqsAns:z.array(z.object({
        questionId:z.string(),
        selectedOption:z.number().int().min(0).max(4),
       
    })),
    theoreticalAns:z.array(z.object({
        questionId:z.string(),
        ans:z.string(),
     
    })),
    startTime:z.coerce.date(),
    submitTime: z.coerce.date(),
        
    
})



export type attemptType= z.infer<typeof tesAttemptSchema> 