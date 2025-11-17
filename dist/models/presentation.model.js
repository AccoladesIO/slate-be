"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const user_model_1 = __importDefault(require("./user.model"));
class Presentation extends sequelize_1.Model {
}
Presentation.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    editorData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    excalidrawData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    shareAccess: {
        type: sequelize_1.DataTypes.ENUM("read", "write"),
        defaultValue: "read",
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: "presentations",
    timestamps: true,
});
// Associations
Presentation.belongsTo(user_model_1.default, { foreignKey: "userId", as: "user" });
user_model_1.default.hasMany(Presentation, { foreignKey: "userId", as: "presentations" });
exports.default = Presentation;
