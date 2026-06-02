/** 文章数据模型 */
export interface ArticleModel {
  id: string;
  user_id: string;
  title: string;
  url: string;
  publish_time: string;
  read_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  created_at: string;
}

/** 创建文章参数 */
export interface CreateArticleParams {
  id: string;
  user_id: string;
  title: string;
  url?: string;
  publish_time?: string;
  read_count?: number;
  like_count?: number;
  share_count?: number;
  comment_count?: number;
}
