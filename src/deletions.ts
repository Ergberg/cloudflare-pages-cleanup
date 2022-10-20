import chalk from "chalk";
import { tableString } from "table-string";
import { headers, Rule, rules } from "./config";
import { Deployment, deploymentURL } from "./deployments";
import { Project } from "./projects";

chalk.level = 1;

const defaultRule = { maxDays: Infinity, maxVersions: Infinity } as Rule;

export function selectDeletions(project: Project) {
  const seen: Record<string, number> = {};
  const match: Record<string, Rule> = {};
  const now = Date.now();

  project.allDeployments.forEach((deployment) => {
    const branchName = deployment.deployment_trigger.metadata.branch;
    const key = `${project.name}/${branchName}`;
    seen[key] = (seen[key] ? seen[key] : 0) + 1;
    const rule =
      match[key] || (match[key] = firstRule(project.name, branchName));

    const shouldDelete =
      seen[key] > rule.maxVersions ||
      (now - new Date(deployment.created_on).getTime()) / 1000 / 60 / 60 / 24 >
        rule.maxDays;

    deployment["rule"] = shouldDelete ? rule.name : "";

    function firstRule(projectName: string, branchName: string): Rule {
      return (
        rules.find(
          (rule) =>
            projectName.match(new RegExp(rule.projects)) &&
            branchName.match(new RegExp(rule.branches))
        ) ?? defaultRule
      );
    }
  });
}

export async function executeDeletions(
  project: Project,
  waitUntil: (promise: Promise<Response>) => void
) {
  project.allDeployments
    .filter((deployment) => deployment.rule)
    .forEach(async (deployment) => {
      const deleteURL = deploymentURL(project.name) + "/" + deployment.id;
      console.log("DELETE " + deleteURL);
      const response = fetch(deleteURL, {
        method: "DELETE",
        headers,
      });
      waitUntil(
        response.then((response) => handleErrors(response, deployment))
      );
    });

  async function handleErrors(response: Response, deployment: Deployment) {
    if (response.status != 200) {
      console.log(
        `\n${response.status} / ${chalk.red(response.statusText)}\nDELETE ${
          deployment.id
        }\n` +
          tableString(
            (
              (await response.json()) as { errors: Record<string, any>[] }
            ).errors.map(
              (error) => ((error.message = chalk.red(error.message)), error)
            )
          )
      );
    }
    return response;
  }
}
