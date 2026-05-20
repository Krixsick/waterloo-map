import express from "express";
import cors from "cors";
import libraryRouter from "./apis/library";
import axios from "axios";
import gymRouter from "./apis/gym";
import "dotenv/config";
import { configDotenv } from "dotenv";
const app = express();
configDotenv();
app.use("/library/hours", libraryRouter);
app.use("/gym", gymRouter);
app.use(cors());

app.listen(3001, () => console.log("listening on :3001"));
