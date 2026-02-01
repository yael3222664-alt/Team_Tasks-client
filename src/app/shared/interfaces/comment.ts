export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  body: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}
