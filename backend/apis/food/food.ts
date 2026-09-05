import { Router } from "express";

import { getCampusFood } from "./campusFood";
import { getResidenceFood } from "./residenceFood";
import { getWusaFood } from "./wusaFood";
import { getStJeromesFood } from "./stJeromesFood";

import type { FoodLocation } from "./types";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [
        campusFood,
        residenceFood,
        wusaFood,
        stJeromesFood,
      ] = await Promise.all([
        getCampusFood(),
        getResidenceFood(),
        getWusaFood(),
        getStJeromesFood(),
      ]);

    const allFood: Record<
      string,
      FoodLocation
    > = {
      ...campusFood,
      ...residenceFood,
      ...wusaFood,
      ...stJeromesFood,
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
