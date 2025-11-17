import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./user.model";
import Presentation from "./presentation.model";

interface SharedPresentationAttributes {
  id: string;
  presentationId: string;
  sharedWithUserId: string;
  accessLevel: "read" | "write";
  sharedByUserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type SharedPresentationCreationAttributes = Omit<
  SharedPresentationAttributes,
  "id" | "createdAt" | "updatedAt"
>;

class SharedPresentation
  extends Model<SharedPresentationAttributes, SharedPresentationCreationAttributes>
  implements SharedPresentationAttributes
{
  public id!: string;
  public presentationId!: string;
  public sharedWithUserId!: string;
  public accessLevel!: "read" | "write";
  public sharedByUserId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SharedPresentation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    presentationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "presentations",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    sharedWithUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    accessLevel: {
      type: DataTypes.ENUM("read", "write"),
      allowNull: false,
      defaultValue: "read",
    },
    sharedByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "shared_presentations",
    timestamps: true,
    indexes: [
      // Prevent duplicate shares
      {
        unique: true,
        fields: ["presentationId", "sharedWithUserId"],
      },
      // Fast lookup for user's shared presentations
      {
        fields: ["sharedWithUserId"],
      },
    ],
  }
);

// Associations
SharedPresentation.belongsTo(Presentation, {
  foreignKey: "presentationId",
  as: "presentation",
});

SharedPresentation.belongsTo(User, {
  foreignKey: "sharedWithUserId",
  as: "sharedWith",
});

SharedPresentation.belongsTo(User, {
  foreignKey: "sharedByUserId",
  as: "sharedBy",
});

Presentation.hasMany(SharedPresentation, {
  foreignKey: "presentationId",
  as: "shares",
});

User.hasMany(SharedPresentation, {
  foreignKey: "sharedWithUserId",
  as: "sharedPresentations",
});

export default SharedPresentation;