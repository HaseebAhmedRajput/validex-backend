// import { Redis } from "ioredis";

// const client = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: Number(process.env.REDIS_PORT) || 6379,
//     password: process.env.REDIS_PASSWORD || undefined,

//   retryStrategy: (times: number) => {
//     if (times > 5) {
//       console.log("Redis connection failed");
//       return undefined;
//     }

//     return Math.min(times * 200, 2000);
//   },
// });

// client.on("error", (err) => {
//   console.log("Redis error:", err.message);
// });

// client.on("connect", () => {
//   console.log("Redis successfully connected");
// });

// client.on("reconnecting", () => {
//   console.log("Reconnecting to Redis...");
// });

// export { client };




import { Redis } from "ioredis";
import 'dotenv/config'; // Sabse upar yeh hona chahiye

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const client = new Redis(redisUrl, {
  retryStrategy: (times: number) => {
    if (times > 5) {
      console.log("Redis connection failed");
      return undefined;
    }

    return Math.min(times * 200, 2000);
  },
});

client.on("error", (err) => {
  console.log("Redis error:", err);
});

client.on("connect", () => {
  console.log("Redis successfully connected");
});

client.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

export { client };