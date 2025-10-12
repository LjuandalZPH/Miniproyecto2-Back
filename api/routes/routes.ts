import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  recoverPassword,
  resetPassword
} from "../controller/user.controller";
import { loginUser } from "../controller/auth.controller";
import { verifyToken } from "../middlewares/auth";

const router = express.Router();


//User CRUD endpoints

router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);


//Auth endpoints
 
router.post("/login", loginUser); 

router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Bienvenido ;D !",
    user: (req as any).user, 
  });
});
//recover pass
router.post("/users/recover-password", recoverPassword);
router.post("/users/reset-password", resetPassword);

export default router;
