import mongoose, { Document, Schema } from 'mongoose';
import { IUserModel } from './User';

export interface IResult {
    quizId: string;
    userId: IUserModel['_id'];
    totalMarks: number;
    resultId: string;
}

export interface IResultModel extends IResult, Document {}

const ResultSchema: Schema = new Schema(
    {
        quizId: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        totalMarks: { type: Number, required: true },
        resultId: { type: String, required: true, unique: true },
    },
    {
        timestamps: true,
        versionKey: false
    }
);


export default mongoose.model<IResultModel>("Result", ResultSchema);