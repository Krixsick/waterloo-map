import express from "express";
import cors from "cors";
import libraryRouter from "./apis/library";
import axios from "axios";
const app = express();

app.use("/library/hours", libraryRouter);
app.use(cors());

app.listen(3001, () => console.log("listening on :3001"));
