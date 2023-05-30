import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
    question: string;
    options: string[];
    answer: string;
    quizId: string;
    marks: number;
    questionId: string;
}

export interface IQuestionModel extends IQuestion, Document {}

const QuestionSchema: Schema = new Schema(
    {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        answer: { type: String, required: true },
        quizId: { type: String, required: true },
        marks: { type: Number, required: true, default: 2 },
        questionId: { type: String, required: true, unique: true },
    },
    {
        timestamps: true,
        versionKey: false
    }
);


export default mongoose.model<IQuestionModel>("Question", QuestionSchema);