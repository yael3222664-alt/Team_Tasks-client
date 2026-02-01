export interface Team {
  id: string;
  name: string;
  ownerId: string;
  _count?: {
    members: number;
  };
}