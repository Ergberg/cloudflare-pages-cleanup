import { tableString } from "table-string";
import { accountAPI } from "./config";
import { fetchList } from "./fetch";
import { Project } from "./projects";

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

export function showDeployments(project: Project) {
  console.log(
    "\n" +
      project.name +
      ":\n" +
      tableString(
        project.allDeployments.map((deployment, idx) => ({
          "": `${idx + 1}.`,
          id: deployment.id,
          branch: deployment.deployment_trigger.metadata.branch,
          "as of": deployment.created_on,
          rule: deployment.rule,
        })),
        [{ name: "", align: "right" }, "id", "branch", "as of", "rule"]
      )
  );
}
