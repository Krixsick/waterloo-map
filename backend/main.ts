import express from "express";
import cors from "cors";
import libraryRouter from "./apis/library";
import gymRouter from "./apis/gym";
import campus_food_router from "./apis/food/campusFood";
import eventRouter from "./apis/event";

import "dotenv/config";
import { configDotenv } from "dotenv";
const app = express();

configDotenv();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use("/library/hours", libraryRouter);
app.use("/gym", gymRouter);
app.use("/food/campus", campus_food_router);
app.use("/events", eventRouter);

app.listen(3001, () => console.log("listening on :3001"));
