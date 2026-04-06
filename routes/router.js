import express from "express";

import requireAuth from "../middleware/auth-config.js";
import { authRateLimit } from "../middleware/rate-limit.js";

import { displayMain, displayAdmin, displayCart, display404, display500 } from "../controllers/display-controller.js";
import { getCartDataControl, getCartStatsControl, addToCartControl, updateCartItemControl, removeFromCartControl, clearCartControl } from "../controllers/data-controller.js";
import { authController } from "../controllers/auth-controller.js";
import { getProductDataControl, addNewProductControl, editProductControl, deleteProductControl, uploadPicControl, deletePicControl } from "../controllers/admin-controller.js";
import { upload } from "../src/upload-back.js";
import { uploadErrorHandler } from "../middleware/upload-error.js";

const router = express.Router();

router.post("/site-auth-route", authRateLimit, authController);

router.get("/admin", requireAuth, displayAdmin);

router.get("/get-product-data-route", getProductDataControl);
router.post("/add-new-product-route", requireAuth, addNewProductControl);
router.post("/edit-product-route", requireAuth, editProductControl);
router.post("/delete-product-route", requireAuth, deleteProductControl);
router.post("/upload-product-pic-route", requireAuth, upload.single("image"), uploadErrorHandler, uploadPicControl);
router.post("/delete-pic-route", requireAuth, deletePicControl);

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
