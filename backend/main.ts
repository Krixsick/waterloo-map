import express from "express";
import cors from "cors";
import libraryRouter, { libraryOccupancyRouter } from "./apis/library";
import gymRouter from "./apis/gym";
import campus_food_router from "./apis/food/campusFood";
import eventRouter from "./apis/event";
import transitRouter from "./apis/transit";
import campusFoodRouter from "./apis/food/campusFood";
import residenceFoodRouter from "./apis/food/residenceFood";

import "dotenv/config";
import { configDotenv } from "dotenv";
const app = express();

configDotenv();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));
const localDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      const isAllowed =
        !origin ||
        allowedOrigins.includes(origin) ||
        localDevelopmentOrigin.test(origin);

      callback(null, isAllowed);
    },
  }),
);
app.use("/library/hours", libraryRouter);
app.use("/library/occupancy", libraryOccupancyRouter);
app.use("/gym", gymRouter);
app.use("/food/campus", campus_food_router);
app.use("/events", eventRouter);
app.use("/transit", transitRouter);
app.use("/food/campus", campusFoodRouter);
app.use("/food/residence", residenceFoodRouter);

app.listen(3001, () => console.log("listening on :3001"));
