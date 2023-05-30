import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import bcrypt from 'bcrypt';
import Logging from '../library/Logging';
import { createToken } from '../library/Token';
import { generateVerificationToken, sendVerificationEmail } from '../library/EmailVerification';

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        } else if(!user.isVerified) {
            return res.status(400).json({ message: 'Email not verified' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate and return session token
        const token = createToken(user.username);

        return res.status(200).json({ message: 'Login successful!', user, token });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to check user' });
    }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json({ message: 'Logout successful!' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to logout user' });
    }
};

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password, name, email } = req.body;

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const emailExist = await User.findOne({ email });
        if (emailExist) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationCode = generateVerificationToken();
        const emailSent = await sendVerificationEmail(email, name, verificationCode);

        console.log(emailSent);
        console.log(emailSent[0]);
        console.log(emailSent[0].statusCode);

        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        const user = new User({
            _id: new mongoose.Types.ObjectId(),
            username,
            password: hashedPassword,
            name,
            email,
            verificationCode
        });

        const savedUser = await user.save();
        return res.status(201).json({ user: { username: savedUser.username, name: savedUser.name, email: savedUser.email } });
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: 'Failed to save user' });
    }
};

const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const emailExist = await User.findOne({ email });
        if (!emailExist) {
            return res.status(409).json({ message: "Email doesn't exists" });
        } else if(emailExist.isVerified) {
            return res.status(409).json({ message: "Email already verified" });
        }

        const verificationCode = generateVerificationToken();
        const emailSent = await sendVerificationEmail(email, emailExist.name, verificationCode);

        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        emailExist.verificationCode = verificationCode;
        await emailExist.save();

        return res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to resend verification email' });
    }
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    const code = req.body.code;
    
    if(code == "" || code == null || code == undefined) {
        return res.status(400).json({ message: 'Invalid verification code' });
    }

    try {
        const user = await User.findOne({ verificationCode: code });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        user.isVerified = true;
        user.verificationCode = '';
        await user.save();

        return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ message: 'Failed to verify email' });
    }
};

const usernameExist = async (req: Request, res: Response, next: NextFunction) => {
    const username = req.params.username;

    try {
        const user = await User.findOne({ username });

        if (user) {
            return res.status(404).json({ message: `${username} is not available` });
        } else {
            return res.status(200).json({ message: `${username} is available` });
        }
    } catch (error) {
        Logging.error(error);

        return res.status(500).json({ message: 'Something went wrong' });
    }
};

const emailExist = async (req: Request, res: Response, next: NextFunction) => {
    const email: string = req.body.email;

    try {
        const user = await User.findOne({ email });

        if (user) {
            return res.status(404).json({ message: `Email is not available` });
        } else {
            return res.status(200).json({ message: `Email is available` });
        }
    } catch (error) {
        Logging.error(error);

        return res.status(500).json({ message: 'Something went wrong' });
    }
};

export default { createUser, login, usernameExist, logout, emailExist, verifyEmail, resendVerificationEmail };
