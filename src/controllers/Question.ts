import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Question from '../models/Question';
import Quiz from '../models/Quiz';
import { verifyToken } from '../library/Token';
import User from '../models/User';
import Logging from '../library/Logging';
import shortid from 'shortid';

const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    const { question: questionName, options, answer, quizId, marks = 2 } = req.body;
    const authHeader = req.headers.authorization;
    try {
        if (!authHeader) {
            return res.status(401).json({ message: 'Missing authorization header' });
        }
        const token = authHeader.split(' ')[1];
        const decoded_user = verifyToken(token);

        if (decoded_user.username == '') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await User.findOne({ username: decoded_user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const quiz = await Quiz.findOne({ quizId });
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (quiz.user.toString() !== user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // ensure that duplicate questionId is not generated
        let questionId = shortid.generate();
        let questionExists = await Question.findOne({ questionId });

        while (questionExists) {
            questionId = shortid.generate();
            questionExists = await Question.findOne({ questionId });
        }

        const question = new Question({
            _id: new mongoose.Types.ObjectId(),
            question: questionName,
            options,
            answer,
            quizId,
            marks,
            questionId: shortid.generate()
        });
        const savedQuestion = await question.save();
        return res.status(201).json({ question: savedQuestion });
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};

const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    const { question: questionName, options, answer} = req.body;
    const questionId = req.params.questionId;
    const authHeader = req.headers.authorization;
    
    try {
        if (!authHeader) {
            return res.status(401).json({ message: 'Missing authorization header' });
        }
        const token = authHeader.split(' ')[1];
        const decoded_user = verifyToken(token);

        if (decoded_user.username == '') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await User.findOne({ username: decoded_user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const question = await Question.findOne({ questionId });
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const que = await question.updateOne({ question: questionName, options, answer });
        return res.status(201).json({ question: que });
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};

export default { createQuestion, updateQuestion };
