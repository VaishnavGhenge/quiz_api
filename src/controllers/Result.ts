import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from '../library/Token';
import User from '../models/User';
import Quiz from '../models/Quiz';
import Result from '../models/Result';
import Question from '../models/Question';
import shortid from 'shortid';
import Logging from '../library/Logging';

const createResult = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded_user = verifyToken(token);
            if (decoded_user.username != '') {
                const user = await User.findOne({ username: decoded_user.username });
                if (user) {
                    const quiz = await Quiz.findOne({ quizId: req.body.quizId.toString() });
                    if (quiz) {
                        const answers = req.body.answers;
                        let totalMarks = 0;
                        const questions = await Question.find({ quizId: req.body.quizId.toString() });

                        answers.forEach((element: { questionId: string; answer: string }) => {
                            const que = questions.find((q) => q.questionId == element.questionId);

                            if (que) {
                                if (que.answer == element.answer) totalMarks += que.marks;
                            } else {
                                res.status(404).json({ message: 'Question not found' });
                            }
                        });

                        let resultId = shortid.generate();
                        let resultExists = await Result.findOne({ resultId });

                        while (resultExists) {
                            resultId = shortid.generate();
                            resultExists = await Result.findOne({ resultId });
                        }

                        const result = new Result({
                            _id: new mongoose.Types.ObjectId(),
                            quizId: req.body.quizId.toString(),
                            userId: user._id,
                            totalMarks,
                            resultId
                        });

                        await result.save();

                        res.status(201).json({ message: 'Quiz result saved' });
                    } else {
                        res.status(404).json({ message: 'Quiz not found' });
                    }
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
};

const getQuizResults = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const quizId = req.params.quizId.toString();
            const token = authHeader.split(' ')[1];
            const decoded_user = verifyToken(token);
            const user = await User.findOne({ username: decoded_user.username });

            if (!user) {
                res.status(404).json({ message: 'User not found' });
            } else {
                const quiz = await Quiz.findOne({ quizId });
                if (!quiz) {
                    res.status(404).json({ message: 'Quiz not found' });
                } else {
                    const results = await Result.find({ quizId }).sort({ totalMarks: -1, createdAt: 1 });

                    // Create an array of user IDs from the results
                    const userIds = results.map((result) => result.userId);

                    // Find all users with matching IDs
                    const users = await User.find({ _id: { $in: userIds } });

                    // Create an array of objects with user and totalMarks
                    const participants = results.map((result) => {
                        const user = users.find((u) => u._id.equals(result.userId));
                        return {
                            user: user?.name,
                            totalMarks: result.totalMarks
                        };
                    });

                    res.status(200).json({ participants });
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


export default { createResult, getQuizResults };
