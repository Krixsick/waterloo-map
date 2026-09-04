import { Router } from "express";

import { getCampusFood } from "./campusFood";
import { getResidenceFood } from "./residenceFood";
import { getWusaFood } from "./wusaFood";

import type { FoodLocation } from "./types";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [
        campusFood,
        residenceFood,
        wusaFood,
      ] = await Promise.all([
        getCampusFood(),
        getResidenceFood(),
        getWusaFood(),
      ]);

    const allFood: Record<
      string,
      FoodLocation
    > = {
      ...campusFood,
      ...residenceFood,
      ...wusaFood,
    };

    res.json(allFood);
  } catch (error) {
    console.error(
      "Failed to fetch food:",
      error,
    );

    res.status(500).json({
      error:
        "Failed to fetch food locations",
    });
  }
});

export default router;
