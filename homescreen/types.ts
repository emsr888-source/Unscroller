export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export enum NavTab {
  Connect,
  Stats,
  Home,
  Chat,
  Profile
}