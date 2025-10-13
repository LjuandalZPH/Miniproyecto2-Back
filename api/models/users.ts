// api/models/user.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}
// security requirements, checks for a valid email definition
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// checks that the password uses ATLEAST 1 number, 1 Capital letter, 1 letter, 1 especial character (@/.&$+-) and its 8 characters or longer
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
//format for user
const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [emailRegex, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      match: [passwordRegex, "Password does not meet security requirements"],
    },
  },
  { timestamps: true }
);

// password encription
UserSchema.pre("save", async function (next) {
  const user = this as IUser;

  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// validate encription with password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);

