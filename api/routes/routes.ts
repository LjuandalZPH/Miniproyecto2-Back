import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} from "../controller/user.controller";

const router = express.Router();

// Users endpoints
router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
