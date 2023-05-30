import mongoose, { Document, Schema } from 'mongoose';
import { IUserModel } from './User';

export interface IQuiz {
    name: string;
    description: string;
    datetime: string;
    user: IUserModel["_id"];
    quizId: string;
}

export interface IQuizModel extends IQuiz, Document {}

const QuizSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: false },
        datetime: { type: Date, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        quizId: { type: String, required: true, unique: true }
    },
    {
        timestamps: true,
        versionKey: false
    }
);


export default mongoose.model<IQuizModel>("Quiz", QuizSchema);