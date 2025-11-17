"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class User extends sequelize_1.Model {
}
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: "unique_email",
            msg: "Email already exists",
        },
        validate: {
            isEmail: {
                msg: "Invalid email format",
            },
            len: {
                args: [5, 50],
                msg: "Email must be between 5 and 50 characters long",
            },
        },
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    verified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    verificationCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    verificationCodeValidation: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    forgotPasswordCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    forgotPasswordCodeValidation: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    tableName: "users",
    timestamps: true,
});
exports.default = User;
