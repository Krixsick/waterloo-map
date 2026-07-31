import express from "express";

import {
  getTransitAlerts,
  getTransitArrivals,
  getTransitVehicles,
  hasAvailableFeed,
} from "../services/transitService";
import { getTransitStops } from "../services/transitScheduleService";

const transitRouter = express.Router();
const CAMPUS_CENTER = { latitude: 43.471, longitude: -80.544 };
const DEFAULT_RADIUS_METERS = 3_000;
const MAX_RADIUS_METERS = 10_000;

function queryNumber(value: unknown, fallback: number) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return Number(value);
}

transitRouter.get("/stops", async (req, res) => {
  const latitude = queryNumber(req.query.lat, CAMPUS_CENTER.latitude);
  const longitude = queryNumber(req.query.lng, CAMPUS_CENTER.longitude);
  const radius = queryNumber(req.query.radius, DEFAULT_RADIUS_METERS);
  const isValid =
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    Number.isFinite(radius) &&
    radius > 0 &&
    radius <= MAX_RADIUS_METERS;

  if (!isValid) {
    res.status(400).json({
      error: `lat/lng must be valid coordinates and radius must be 1-${MAX_RADIUS_METERS}`,
    });
    return;
  }

  const result = await getTransitStops(latitude, longitude, radius);
  res.status(hasAvailableFeed(result) ? 200 : 503).json(result);
});

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
