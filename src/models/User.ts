import mongoose, { Document, Schema } from 'mongoose';

export interface IUser {
    username: string;
    password: string;
    name: string;
    email: string;
    isVerified: boolean;
    verificationCode: string;
}

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        verificationCode: { type: String },
    },
    {
        timestamps: true,
        versionKey: false
    }
);


export default mongoose.model<IUserModel>("User", UserSchema);