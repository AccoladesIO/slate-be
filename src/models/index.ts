import sequelize from "../config/database";
import User from "./user.model";
import Presentation from "./presentation.model";
import SharedPresentation from "./sharedPresentation.model";
export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ All models synced successfully");
  } catch (error) {
    console.error("❌ Error syncing database:", error);
  }
};

export { User, Presentation, SharedPresentation };
