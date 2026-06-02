/** 用户数据模型 */
export interface UserModel {
  id: string;
  email: string;
  name: string;
  avatar: string;
  ai_mode: string;
  openai_api_key: string;
  openai_base_url: string;
  openai_model: string;
  ollama_base_url: string;
  ollama_model: string;
  created_at: string;
  updated_at: string;
}

/** 创建用户参数 */
export interface CreateUserParams {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}
