import express from 'express';
import controller from '../controllers/Question';
import { ValidateJoi, Schemas } from '../middleware/Joi';

const router = express.Router();

router.post('/create', ValidateJoi(Schemas.question.create), controller.createQuestion);
router.put('/update/:questionId', ValidateJoi(Schemas.question.update), controller.updateQuestion);


export = router;