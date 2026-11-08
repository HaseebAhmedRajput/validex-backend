class ApiError extends Error {
   public success: boolean= false;
   public data : any = null
  constructor(
    public statusCode: number,
    public message: string = "Something went wrong",
    public errors: any[] = [],
     stack ?: string
  ) {
    super(message);

    if(stack){
      this.stack= stack
    }
    else{
      Error.captureStackTrace(this,this.constructor)
    }
   

  
  }
}

export { ApiError };
