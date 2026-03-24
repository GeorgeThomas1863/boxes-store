import express from "express";

import requireAuth from "../middleware/auth-config.js";
import { authRateLimit } from "../middleware/rate-limit.js";

import { displayMain, displayCart, display404, display500 } from "../controllers/display-controller.js";
import { getCartDataControl, getCartStatsControl, addToCartControl, updateCartItemControl, removeFromCartControl, clearCartControl } from "../controllers/data-controller.js";

const router = express.Router();

router.get("/", displayMain);
router.get("/cart", displayCart);

router.get("/cart/data", getCartDataControl);
router.get("/cart/stats", getCartStatsControl);
router.post("/cart/add", addToCartControl);
router.post("/cart/update", updateCartItemControl);
router.post("/cart/remove", removeFromCartControl);
router.post("/cart/clear", clearCartControl);

router.use(display404);

router.use(display500);

export default router;
