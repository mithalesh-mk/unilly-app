import { FollowRequestBody, UserByIdResponse } from "./user.types";
import axiosInstance from "@/utils/Axios";

export const getUserById = async (userId: number | string) => {
  try {
    const res = await axiosInstance.get<UserByIdResponse>(
      `/auth/user/${userId}`,
    );
    return res.data.data;
  } catch (error: any) {
    console.log("Get User Error:", error?.response?.data || error.message);
    throw error;
  }
};

//follow
export const toggleFollowUser = async (data: FollowRequestBody) => {
  try {
    const res = await axiosInstance.post(`/users/follow`, data);
    return res.data;
  } catch (error: any) {
    console.log("Follow Error:", error?.response?.data || error.message);
    throw error;
  }
};