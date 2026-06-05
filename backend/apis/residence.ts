import * as cheerio from "cheerio";
import express from "express";

const residence_router = express.Router();

const scrap_residences = async () => {};

residence_router.get("/", (req, res) => {
  try {
    scrap_residences();
  } catch (error) {
    console.log(error);
  }
});

export default residence_router;
