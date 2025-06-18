export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  topics: string[];
  license: any;
  fork: boolean;
  created_at: string;
  updated_at: string;
}
