import { Router } from "express";
import { health } from "../controllers/health.controllers.js";

const router = Router();

router.route("/").get(health);

export default router;
