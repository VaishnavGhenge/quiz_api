import express from "express";
import http from "http";
import mongoose from "mongoose";
import { config } from "./config/config";
import Logging from "./library/Logging";
import userRoutes from "./routes/User"
import quizRoutes from "./routes/Quiz"
import questionRoutes from "./routes/Question"
import resultRoutes from "./routes/Result"

const router = express();

// Connect to Mongo
mongoose
  .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
  .then(() => {
    Logging.info("Connected to MongoDB.");
    StartServer();
  })
  .catch((err) => {
    Logging.error("Unable to connect: ")
    Logging.error(err)
  });

//   Only start server if mongoose connects
const StartServer = () => {
    // log the request
    router.use((req, res, next) => {
        // log the request
        Logging.info(`Incomming - METHOD [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            // log the res
            Logging.info(`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`);
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    // rules of our API
    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if(req.method == 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
            return res.status(200).json({});
        }

        next();
    });

    // Routes
    router.use("/users", userRoutes);
    router.use("/quizzes", quizRoutes);
    router.use("/questions", questionRoutes);
    router.use("/results", resultRoutes);

    // healthcheck
    router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

    // error handling
    router.use((req, res, next) => {
        const error  = new Error('Not found');

        Logging.error(error);

        res.status(404).json({
            message: error.message
        });
    });

    http.createServer(router).listen(config.server.port, () => Logging.info(`Server is running on port ${config.server.port}`));
}