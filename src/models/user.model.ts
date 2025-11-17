import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  id: string;
  name: string,
  email: string;
  password: string;
  verified: boolean;
  verificationCode?: string | null;
  verificationCodeValidation?: string | null;
  forgotPasswordCode?: string | null;
  forgotPasswordCodeValidation?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreationAttributes = Omit<UserAttributes, "id" | "verified"> & Partial<Pick<UserAttributes, "id" | "verified">>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public name!: string;
  public password!: string;
  public verified!: boolean;
  public verificationCode!: string | null;
  public verificationCodeValidation!: string | null;
  public forgotPasswordCode!: string | null;
  public forgotPasswordCodeValidation!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(50),
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
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationCodeValidation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    forgotPasswordCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    forgotPasswordCodeValidation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  }
);

export default User;
