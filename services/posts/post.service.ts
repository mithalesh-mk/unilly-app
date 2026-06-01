import axiosInstance from "@/utils/Axios";
import type {
  CommentRequestBody,
  CreatePostRequest,
  CreatePostResponse,
  FeedParams,
  FeedResponse,
  GetRepliesResponse,
  UploadPostMediaRequest,
  UploadPostMediaResponse,
} from "./post.types";

const getMimeTypeFromUri = (uri: string) => {
  const cleanUri = uri.split("?")[0];
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "heic":
      return "image/heic";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return "image/jpeg";
  }
};

const getExtensionFromMimeType = (type: string) => {
  switch (type) {
    case "image/png":
      return "png";
    case "image/heic":
      return "heic";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      return "jpg";
  }
};

const getFileNameFromUri = (uri: string, type: string) => {
  const cleanUri = uri.split("?")[0];
  const existingName = cleanUri.split("/").pop();

  if (existingName && existingName.includes(".")) {
    return existingName;
  }

  return `upload.${getExtensionFromMimeType(type)}`;
};

export const uploadPostMedia = async (file: UploadPostMediaRequest) => {
  const formData = new FormData();
  const type = file.type ?? getMimeTypeFromUri(file.uri);
  const filePayload = {
    uri: file.uri,
    name: file.name ?? getFileNameFromUri(file.uri, type),
    type,
  };

  formData.append("file", filePayload as any);

  const response = await axiosInstance.post<UploadPostMediaResponse>(
    "/posts/media/upload",
    formData,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data) => data,
    },
  );

  return response.data;
};

export const createPost = async (data: CreatePostRequest) => {
  const response = await axiosInstance.post<CreatePostResponse>("/posts", data);
  return response.data;
};

export const fetchFeedPosts = async (params: FeedParams): Promise<FeedResponse> => {
  try {
    const res = await axiosInstance.get("/posts/feed", {
      params,
    });

    return res.data; // { items, pagination }
  } catch (error: any) {
    console.log("Fetch Feed Error:", error?.response?.data || error.message);
    throw error;
  }
};

// services/postService.ts (extend)

export const toggleLikePost = async (postId: number) => {
  try {
    const res = await axiosInstance.post(`/posts/${postId}/like`);
    return res.data;
  } catch (error: any) {
    console.log("Like Error:", error?.response?.data || error.message);
    throw error;
  }
};

export const deletePost = async (postId: number) => {
  try {
    const res = await axiosInstance.delete(`/posts/${postId}`);
    return res.data;
  } catch (error: any) {
    console.log("Delete Error:", error?.response?.data || error.message);
    throw error;
  }
};

export const getCommentsByPost = async (
  postId: number,
  page = 1,
  limit = 10,
) => {
  const res = await axiosInstance.get(
    `/posts/${postId}/comments?page=${page}&limit=${limit}`,
  );
  return res.data;
};

export const createComment = async (
  postId: number,
  data: CommentRequestBody,
) => {
  const res = await axiosInstance.post(`/posts/${postId}/comments`, data);
  return res.data;
};

export const addReplyToComment = async (
  commentId: number,
  data: CommentRequestBody,
) => {
  const res = await axiosInstance.post(`/comments/${commentId}/replies`, data);
  return res.data;
};

export const getRepliesByCommentId = async (
  commentId: number,
  page = 1,
  limit = 10,
) => {
  const res = await axiosInstance.get<GetRepliesResponse>(
    `posts/comment/${commentId}/replies?page=${page}&limit=${limit}`,
  );
  return res.data;
};

export const toggleLikeComment = async (commentId: number) => {
  const res = await axiosInstance.post(`/comments/${commentId}/like`);
  return res.data;
};