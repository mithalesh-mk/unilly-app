export interface UploadPostMediaRequest {
  uri: string;
  name?: string;
  type?: string;
}

export interface UploadedPostMedia {
  media_id: number | string;
  public_id: string;
  url?: string;
  [key: string]: unknown;
}

export interface UploadPostMediaResponse {
  success: boolean;
  message: string;
  data: UploadedPostMedia;
}

export interface CreatePostRequest {
  title: string;
  Body: string;
  tagged_user_ids: number[];
  Media_ids: number[];
}

export interface PostRecord {
  id: number;
  title?: string;
  Body?: string;
  [key: string]: unknown;
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  data: PostRecord;
}

export type FeedParams = {
  page: number;
  limit: number;
  scope: "all" | "following" | "mine";
};

export interface Author {
  id: number;
  username: string;
  name: string;
  profile_pic: string;
}

export interface PostStats {
  likes_count: number;
  comments_count: number;
}

export interface FeedPost {
  id: number;
  title: string;
  body: string;
  status: string;
  user_id: number;

  author: Author;

  tagged_users: null;

  image_urls: string[];

  stats: PostStats;

  is_liked: boolean;

  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
}

export interface FeedData {
  items: FeedPost[];
  pagination: Pagination;
}

export interface FeedResponse {
  statuscode: number;
  success: boolean;
  message: string;
  data: FeedData;
}

export interface CommentRequestBody {
  message: string;
  parent_comment_id?: number;
}

// ---------------- AUTHOR ------------
export interface CommentAuthor {
  id: number;
  username: string;
  name: string;
  profile_pic: string;
}

// ---------------- COMMENT -------------
export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  message: string;
  author: CommentAuthor;

  created_at: string;
  updated_at: string;

  replies_count: number;
  likes_count: number;
  is_liked: boolean;

  // for frontend threading
  parent_comment_id?: number | null;
  replies?: Comment[];
}

// ---------------- API RESPONSE -----------
export interface GetRepliesResponse {
  statuscode: number;
  success: boolean;
  message: string;
  data: Comment[];
}