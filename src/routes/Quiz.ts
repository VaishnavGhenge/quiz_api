import express from "express";
import controller from "../controllers/Quiz";
import { ValidateJoi, Schemas } from "../middleware/Joi";

const router = express.Router();

router.post("/create", ValidateJoi(Schemas.quiz.create), controller.createQuiz);
router.get("/get/:id", controller.getQuiz);
router.patch("/update/:id",ValidateJoi(Schemas.quiz.upadate), controller.updateQuiz);
router.delete('/delete/:quizId', controller.deleteQuiz);
router.get("/get/user/all", controller.getUserQuizes);
router.get('/get/:quizId/questions', controller.getQuizQuestions);

export = router;