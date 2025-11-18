import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./user.model";
import Presentation from "./presentation.model";
import { randomBytes } from "crypto";

interface ShareLinkAttributes {
  id: string;
  presentationId: string;
  token: string; // Unique shareable token
  accessLevel: "read" | "write";
  password?: string | null;
  expiresAt?: Date | null;
  maxViews?: number | null;
  viewCount: number;
  createdByUserId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type ShareLinkCreationAttributes = Omit<
  ShareLinkAttributes,
  "id" | "token" | "viewCount" | "createdAt" | "updatedAt"
> &
  Partial<Pick<ShareLinkAttributes, "id" | "token" | "viewCount">>;

class ShareLink
  extends Model<ShareLinkAttributes, ShareLinkCreationAttributes>
  implements ShareLinkAttributes
{
  public id!: string;
  public presentationId!: string;
  public token!: string;
  public accessLevel!: "read" | "write";
  public password!: string | null;
  public expiresAt!: Date | null;
  public maxViews!: number | null;
  public viewCount!: number;
  public createdByUserId!: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public readonly presentation?: typeof Presentation.prototype;
  public readonly createdBy?: typeof User.prototype;

  // Instance method to check if link is valid
  public isValid(): boolean {
    if (!this.isActive) return false;
    
    // Check expiration
    if (this.expiresAt && new Date() > this.expiresAt) {
      return false;
    }
    
    // Check max views
    if (this.maxViews && this.viewCount >= this.maxViews) {
      return false;
    }
    
    return true;
  }

  // Generate unique token
  public static generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}

ShareLink.init(
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
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      defaultValue: () => ShareLink.generateToken(),
    },
    accessLevel: {
      type: DataTypes.ENUM("read", "write"),
      allowNull: false,
      defaultValue: "read",
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Hashed password for protected links",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Link expires after this date",
    },
    maxViews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Maximum number of times this link can be viewed",
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "share_links",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["token"],
      },
      {
        fields: ["presentationId"],
      },
      {
        fields: ["expiresAt"],
      },
    ],
  }
);

// Associations
ShareLink.belongsTo(Presentation, {
  foreignKey: "presentationId",
  as: "presentation",
});

ShareLink.belongsTo(User, {
  foreignKey: "createdByUserId",
  as: "createdBy",
});

Presentation.hasMany(ShareLink, {
  foreignKey: "presentationId",
  as: "shareLinks",
});

export default ShareLink;