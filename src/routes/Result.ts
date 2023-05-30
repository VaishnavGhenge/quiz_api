import express from 'express';
import controller from '../controllers/Result';
import { ValidateJoi, Schemas } from '../middleware/Joi';

const router = express.Router();

router.post('/create', ValidateJoi(Schemas.result.create), controller.createResult);
// router.get('/get/:id', controller.getResult);
// router.get('/get/user/all', controller.getUserResults);
router.get('/get/:quizId', controller.getQuizResults);

export = router;
