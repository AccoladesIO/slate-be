import express from "express";
import { createPresentationController, deletePresentationController, duplicatePresentation, getAllPresentationsController, getPresentationByIdController, updatePresentationController } from "../controller/presentation.controllers";
import { authMiddleware } from "../middleware/auth";

const presentationRouter = express.Router();
// All routes require authentication
presentationRouter.use(authMiddleware);

presentationRouter.post("/", createPresentationController);
presentationRouter.get("/", getAllPresentationsController);
presentationRouter.get("/:id", getPresentationByIdController);
presentationRouter.put("/:id", updatePresentationController);
presentationRouter.delete("/:id", deletePresentationController);
presentationRouter.post("/:id/duplicate", duplicatePresentation)

export default presentationRouter;