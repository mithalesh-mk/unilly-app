export interface FollowRequestBody {
  following_id: number;
}

export type UserVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | string;

export interface PublicUser {
  id: number;
  email: string;
  username: string;
  name: string;
  course?: string;
  yop?: number;
  dob?: string;
  profile_pic?: string;
  verification_status?: UserVerificationStatus;
}

export interface UserByIdResponse {
  statuscode: number;
  success: boolean;
  message: string;
  data: PublicUser;
}