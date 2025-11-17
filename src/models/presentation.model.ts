import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./user.model";

interface PresentationAttributes {
  id: string;
  title: string;
  description?: string | null;
  editorData?: object | null;
  excalidrawData?: object | null;
  isPublic: boolean;
  shareAccess: "read" | "write";
  userId: string; // foreign key
  createdAt?: Date;
  updatedAt?: Date;
}

type PresentationCreationAttributes = Omit<
  PresentationAttributes,
  "id" | "description" | "editorData" | "excalidrawData" | "isPublic" | "shareAccess"
> &
  Partial<
    Pick<
      PresentationAttributes,
      "id" | "description" | "editorData" | "excalidrawData" | "isPublic" | "shareAccess"
    >
  >;

class Presentation
  extends Model<PresentationAttributes, PresentationCreationAttributes>
  implements PresentationAttributes
{
  public id!: string;
  public title!: string;
  public description!: string | null;
  public editorData!: object | null;
  public excalidrawData!: object | null;
  public isPublic!: boolean;
  public shareAccess!: "read" | "write";
  public userId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Presentation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    editorData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    excalidrawData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    shareAccess: {
      type: DataTypes.ENUM("read", "write"),
      defaultValue: "read",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "presentations",
    timestamps: true,
  }
);

// Associations
Presentation.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Presentation, { foreignKey: "userId", as: "presentations" });

export default Presentation;
