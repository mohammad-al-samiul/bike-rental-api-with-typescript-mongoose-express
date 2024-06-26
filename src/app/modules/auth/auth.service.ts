import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TLoginUser, TUser } from "./auth.interface";
import { User } from "./auth.model";
import bcrypt from "bcrypt";
import config from "../../config";
import createToken from "./auth.utils";
import jwt, { JwtPayload } from "jsonwebtoken";

const createUserIntoDB = async (payload: TUser) => {
  const result = await User.create(payload);
  return result;
};

const loginUserFromDB = async (payload: TLoginUser) => {
  const isUserExist = await User.findOne({ email: payload.email }).select(
    "+password"
  );
  const user = isUserExist;
  //check if a user with this email
  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found with this email!");
  }

  //compare password using bcrypt
  const isPasswordMatch = await bcrypt.compare(
    payload?.password,
    isUserExist?.password
  );

  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Password is incorrect!");
  }

  //generate access token
  const jwtPayload = {
    email: isUserExist?.email,
    role: isUserExist?.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const getAllUserFromDB = async () => {
  const result = await User.find();
  return result;
};

const refreshToken = async (token: string) => {
  const decoded = jwt.verify(token, config.jwt_refresh_secret as string);
  // console.log("decoded : ", decoded);
  const { email } = decoded as JwtPayload;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }
  const jwtPayload = {
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
  };
};

export const UserServices = {
  createUserIntoDB,
  loginUserFromDB,
  getAllUserFromDB,
  refreshToken,
};
