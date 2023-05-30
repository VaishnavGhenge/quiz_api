import express from "express";
import controller from "../controllers/User";
import { ValidateJoi, Schemas } from "../middleware/Joi";

const router = express.Router();

router.post("/login", ValidateJoi(Schemas.user.login), controller.login);
router.get("/logout/:username", controller.logout);
router.post("/create", ValidateJoi(Schemas.user.create), controller.createUser);
router.get("/check-user/:username", controller.usernameExist);
router.post("/check-email", ValidateJoi(Schemas.user.checkEmail), controller.emailExist);
router.post("/verify-email", controller.verifyEmail);
router.post('/resend-email', ValidateJoi(Schemas.user.resendVerificationEmail), controller.resendVerificationEmail);

export = router;