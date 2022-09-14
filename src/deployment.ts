import { accountAPI } from "./config";
import { fetchList } from "./fetch";

export type Deployment = {
  created_on: string;
  id: string;
  deployment_trigger: { metadata: { branch: string } };
  rule: string;
};

export async function deployments(projectName: string): Promise<Deployment[]> {
  const list = fetchList(`/pages/projects/${projectName}/deployments`);
  return list as Promise<Deployment[]>;
}

export function deploymentURL(projectName: string) {
  return `${accountAPI}/pages/projects/${projectName}/deployments`;
}
