"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Presentation = exports.User = exports.syncDatabase = void 0;
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
exports.User = user_model_1.default;
const presentation_model_1 = __importDefault(require("./presentation.model"));
exports.Presentation = presentation_model_1.default;
const syncDatabase = async () => {
    try {
        await database_1.default.sync({ alter: true });
        console.log("✅ All models synced successfully");
    }
    catch (error) {
        console.error("❌ Error syncing database:", error);
    }
};
exports.syncDatabase = syncDatabase;
