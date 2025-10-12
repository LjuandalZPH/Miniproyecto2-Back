import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  recoverPassword,
  resetPassword
} from "../controller/user.controller";

const router = express.Router();

// Users endpoints
router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

//recover pass
router.post("/users/recover-password", recoverPassword);
router.post("/users/reset-password", resetPassword);

export default router;
