export interface Project {
  id: number;
  team_id: number;
  name: string;
  description?: string | null;
  status?: string;
}