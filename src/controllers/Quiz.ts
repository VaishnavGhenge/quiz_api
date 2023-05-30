import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz';
import User from '../models/User';
import { verifyToken } from '../library/Token';
import shortid from 'shortid';
import Question from '../models/Question';
import Logging from '../library/Logging';
import Result from '../models/Result';

const createQuiz = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded_user = verifyToken(token);
            const { name, description = '', datetime: dateString } = req.body;
            const datetime = new Date(dateString);
            const user = await User.findOne({ username: decoded_user.username });

            // ensure that duplicate quizId is not generated
            let quizId = shortid.generate();
            let quizExists = await Quiz.findOne({ quizId });

            while (quizExists) {
                quizId = shortid.generate();
                quizExists = await Quiz.findOne({ quizId });
            }

            if (user) {
                const quiz = new Quiz({
                    _id: new mongoose.Types.ObjectId(),
                    name,
                    description,
                    datetime,
                    user: user._id,
                    quizId
                });
                const savedQuiz = await quiz.save();
                return res.status(201).json({ quiz: { name: savedQuiz.name, quizId: savedQuiz.quizId } });
            } else {
                return res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
};

const getQuiz = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const quizId = req.params.id;
            const token = authHeader.split(' ')[1];
            const decoded_user = verifyToken(token);
            const user = await User.findOne({ username: decoded_user.username });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const quiz = await Quiz.findOne({ quizId });
            if (quiz) {
                if (!quiz.user.equals(user._id)) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                const questions = await Question.find({ quizId });
                return res.status(200).json({ quiz: { name: quiz.name, quizId: quiz.quizId, questions } });
            } else {
                return res.status(404).json({ message: 'Quiz not found' });
            }
        } catch (error) {
            Logging.error(error);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
};

const updateQuiz = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const user = verifyToken(token);
            if (user.username != '') {
                const quiz_id = req.params.id;
                const old_quiz = await Quiz.findById(quiz_id);
                const user_object = await User.findOne({ username: user.username });

                if (old_quiz && user_object) {
                    if (!old_quiz.user.equals(user_object._id)) {
                        return res.status(401).json({ message: 'Unauthorized' });
                    }

                    const { name = old_quiz.name, description = old_quiz.description, datetime = old_quiz.datetime } = req.body;
                    const quiz = await Quiz.findByIdAndUpdate(quiz_id, { name, description, datetime }, { new: true });
                    res.status(200).json({ quiz });
                } else {
                    res.status(404).json({ message: 'Quiz not found' });
                }
            }
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
};

const deleteQuiz = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const user = verifyToken(token);
            if (user.username != '') {
                const quiz_id = req.params.quizId.toString();

                const old_quiz = await Quiz.findOne({ quizId: quiz_id })
                const user_object = await User.findOne({ username: user.username });
                if (old_quiz && user_object) {
                    if (!old_quiz.user.equals(user_object._id)) {
                        return res.status(401).json({ message: 'Unauthorized' });
                    }
                    const quiz = await Quiz.findOneAndDelete({ quizId: quiz_id });
                    await Question.deleteMany({ quizId: quiz_id });
                    if (quiz) {
                        res.status(200).json({ message: 'Quiz deleted' });
                    } else {
                        res.status(404).json({ message: 'Quiz not found' });
                    }
                } else {
                    res.status(404).json({ message: 'Quiz not found' });
                }
            }
        } catch (error) {
            Logging.error(error);
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
};

const getUserQuizes = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const user = verifyToken(token);
            if (user.username != '') {
                const user_object = await User.findOne({ username: user.username });
                if (user_object) {
                    const quizes = await Quiz.find({ user: user_object._id });
                    res.status(200).json({ quizes });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            }
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
};

const getQuizQuestions = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const quiz_id = req.params.quizId;
            const token = authHeader.split(' ')[1];
            const decoded_user = verifyToken(token);
            const user = await User.findOne({ username: decoded_user.username });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const quiz = await Quiz.findOne({ quizId: quiz_id });
            if (quiz) {
                const already_answered = await Result.findOne({ quizId: quiz_id, userId: user._id });
                console.log(already_answered);
                if (already_answered) {
                    return res.status(401).json({ message: 'Quiz already given' });
                }

                const now = new Date();
                const quiz_date = new Date(quiz.datetime);
                if (now < quiz_date) {
                    return res.status(401).json({ message: 'Quiz not started yet' });
                }

                const questions = await Question.find({ quizId: quiz_id });
                
                // return question without correct answer
                questions.forEach((question) => {
                    question.answer = '';
                });

                return res.status(200).json({ questions });
            } else {
                return res.status(404).json({ message: 'Quiz not found' });
            }
        } catch (error) {
            Logging.error(error);
            return res.status(401).json({ message: 'Invalid token' });
        }
    }
};

export default { createQuiz, getQuiz, updateQuiz, deleteQuiz, getUserQuizes, getQuizQuestions };
