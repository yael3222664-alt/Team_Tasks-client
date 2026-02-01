export type TaskStatus = 'Backlog' | 'In Progress' | 'Done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: number; 
  assigned_to?: number | null;
  assignee_id?: number | null; // השרת מחזיר assignee_id
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}
