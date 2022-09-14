import { fetchList } from "./fetch";

export type Project = {
  name: string;
};

export async function projects(): Promise<Project[]> {
  return fetchList("/pages/projects") as Promise<Project[]>;
}
