import { Router } from "express";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../controllers/favorite.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.route("/").get(protect, getFavorites).post(protect, addFavorite);

router.route("/:hotelId").delete(protect, removeFavorite);

export default router;
