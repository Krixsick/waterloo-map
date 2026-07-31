import express from "express";

import {
  getTransitAlerts,
  getTransitArrivals,
  getTransitVehicles,
  hasAvailableFeed,
} from "../services/transitService";

const transitRouter = express.Router();

transitRouter.get("/vehicles", async (_req, res) => {
  const result = await getTransitVehicles();
  res.status(hasAvailableFeed(result) ? 200 : 503).json(result);
});

transitRouter.get("/arrivals", async (req, res) => {
  const stopId = typeof req.query.stopId === "string" ? req.query.stopId.trim() : "";
  if (!stopId) {
    res.status(400).json({ error: "stopId is required" });
    return;
  }

  const result = await getTransitArrivals(stopId);
  res.status(hasAvailableFeed(result) ? 200 : 503).json(result);
});

transitRouter.get("/alerts", async (_req, res) => {
  const result = await getTransitAlerts();
  res.status(hasAvailableFeed(result) ? 200 : 503).json(result);
});

export default transitRouter;
