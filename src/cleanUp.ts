import { headers, Rule, rules } from "./config";
import { Project, projects } from "./project";
import { deployments, deploymentURL } from "./deployment";
import { table } from "./table";

const defaultRule = { maxDays: Infinity, maxVersions: Infinity } as Rule;

export default async function cleanUp() {
  const now = new Date().getTime();
  console.log(table("Rules", rules));
  const allProjects = await projects();
  console.log(
    table(
      "Projects",
      allProjects.map((p, idx) => ({ "#": idx + 1, name: p.name }))
    )
  );

  for (let p = 0; p < allProjects.length; ++p) {
    const project = allProjects[p];
    const allDeployments = await deployments(project.name);
    const seen: Record<string, number> = {};
    const match: Record<string, Rule> = {};

    selectDeletions();
    logDeployments();
    executeDeletions();

    function selectDeletions() {
      for (let d = 0; d < allDeployments.length; ++d) {
        const deployment = allDeployments[d];
        const projectName = project.name;
        const branchName = deployment.deployment_trigger.metadata.branch;
        const key = `${projectName}/${branchName}`;
        seen[key] = (seen[key] ? seen[key] : 0) + 1;
        const rule =
          match[key] || (match[key] = firstRule(projectName, branchName));

        const del =
          seen[key] > rule.maxVersions ||
          (now - new Date(deployment.created_on).getTime()) /
            1000 /
            60 /
            60 /
            24 >
            rule.maxDays;

        deployment["rule"] = del ? rule.name : "";

        function firstRule(projectName: string, branchName: string): Rule {
          return (
            rules.find(
              (rule) =>
                projectName.match(new RegExp(rule.projects)) &&
                branchName.match(new RegExp(rule.branches))
            ) ?? defaultRule
          );
        }
      }
    }

    function logDeployments() {
      console.log(
        table(
          project.name,
          allDeployments.map((d, idx) => ({
            "#": `${idx + 1}.`,
            branch: d.deployment_trigger.metadata.branch,
            "as of": d.created_on,
            rule: d.rule,
          }))
        )
      );
    }

    async function executeDeletions() {
      allDeployments
        .filter((d) => d.rule)
        .forEach(async (deployment) => {
          const deleteURL = deploymentURL(project.name) + "/" + deployment.id;
          const response = await fetch(deleteURL, {
            method: "DELETE",
            headers,
          });
          if (response.status != 200)
            console.log(
              table(
                response.status +
                  " / " +
                  response.statusText +
                  "\n" +
                  deleteURL,
                ((await response.json()) as { errors: Record<string, any>[] })
                  .errors
              )
            );
        });
    }
  }
  return new Response("OK", { status: 200 });
}
