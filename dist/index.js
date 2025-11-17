"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoute_1 = __importDefault(require("./router/authRoute"));
const database_1 = require("./config/database");
const models_1 = require("./models");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ROUTES
app.use("/api/auth", authRoute_1.default);
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route does not exist" });
});
app.get("/", (req, res) => {
    res.send("App is live");
});
const startServer = async () => {
    await (0, database_1.connectDB)();
    await (0, models_1.syncDatabase)();
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
};
startServer();
