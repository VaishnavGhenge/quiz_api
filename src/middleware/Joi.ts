import Joi, {ObjectSchema} from "joi";
import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
import { IQuiz } from "../models/Quiz";
import Logging from "../library/Logging";

export const ValidateJoi = (schema: ObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validateAsync(req.body);
            next();
        } catch (error) {
            Logging.error(error);
            return res.status(422).json({ error });
        }
    };
};

export const Schemas = {
    user: {
        create: Joi.object<IUser>({
            username: Joi.string().required(),
            password: Joi.string().required(),
            name: Joi.string().required(),
            email: Joi.string().required(),
        }),
        login: Joi.object<IUser>({
            username: Joi.string().required(),
            password: Joi.string().required(),
        }),
        checkEmail: Joi.object<IUser>({
            email: Joi.string().required(),
        }),
        resendVerificationEmail: Joi.object<IUser>({
            email: Joi.string().required(),
        }),
    },
    quiz: {
        create: Joi.object<IQuiz>({
            name: Joi.string().required(),
            datetime: Joi.string().required(),
            description: Joi.string().empty(''),
        }),
        upadate: Joi.object<IQuiz>({
            name: Joi.string(),
            description: Joi.string(),
            datetime: Joi.string(),
        }),
    },
    question: {
        create: Joi.object({
            question: Joi.string().required(),
            options: Joi.array().items(Joi.string()).required().length(4),
            answer: Joi.string().required(),
            quizId: Joi.string().required(),
            marks: Joi.number().empty('').default(2),
        }),
        update: Joi.object({
            question: Joi.string().required(),
            options: Joi.array().items(Joi.string()).required().length(4),
            answer: Joi.string().required(),
        }),
    },
    result: {
        create: Joi.object({
            quizId: Joi.string().required(),
            answers: Joi.array().items(Joi.object({ questionId: Joi.string().required(), answer: Joi.string().required() })).required(),
        }),
    }
}