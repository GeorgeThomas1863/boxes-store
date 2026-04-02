import express from "express";

import requireAuth from "../middleware/auth-config.js";
import { authRateLimit } from "../middleware/rate-limit.js";

import { displayMain, displayAdmin, displayCart, display404, display500 } from "../controllers/display-controller.js";
import { getCartDataControl, getCartStatsControl, addToCartControl, updateCartItemControl, removeFromCartControl, clearCartControl } from "../controllers/data-controller.js";
import { authController } from "../controllers/auth-controller.js";

const router = express.Router();

router.post("/site-auth-route", authRateLimit, authController);

router.get("/admin", requireAuth, displayAdmin);


router.get("/cart", displayCart);

router.get("/cart/data", getCartDataControl);
router.get("/cart/stats", getCartStatsControl);
router.post("/cart/add", addToCartControl);
router.post("/cart/update", updateCartItemControl);
router.post("/cart/remove", removeFromCartControl);
router.post("/cart/clear", clearCartControl);

router.get("/", displayMain);

router.use(display404);

router.use(display500);

export default router;
