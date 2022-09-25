import { DEBUG, headers, projectID, Rule, rules } from "./config";
import { projects } from "./project";
import { Deployment, deployments, deploymentURL } from "./deployment";
import { tableString } from "table-string";
import chalk from "chalk";

const defaultRule = { maxDays: Infinity, maxVersions: Infinity } as Rule;

export default async function cleanUp() {
  const now = Date.now();
  showRules();
  const allProjects = await projects();
  showProjects(allProjects);

  if (allProjects && allProjects.length !== 0) {
    const date = new Date();
    const idx = computeIndex(now, date);
    console.log("projectID :>> ", projectID);
    console.log("idx :>> ", idx);

    for (let p = 0; p < allProjects.length; ++p) {
      if (projectID === "round-robin") {
        allProjects[p] = allProjects[idx % allProjects.length];
        allProjects.length = 1;
      } else if (projectID && allProjects[p].name !== projectID) {
        continue;
      }
      const project = allProjects[p];
      const allDeployments = await deployments(project.name);
      const seen: Record<string, number> = {};
      const match: Record<string, Rule> = {};

      selectDeletions();
      DEBUG && logDeployments();
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

          const shouldDelete =
            seen[key] > rule.maxVersions ||
            (now - new Date(deployment.created_on).getTime()) /
              1000 /
              60 /
              60 /
              24 >
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
        }
      }

      function logDeployments() {
        console.log(
          "\n" +
            project.name +
            ":\n" +
            tableString(
              allDeployments.map((deployment, idx) => ({
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

      async function executeDeletions() {
        allDeployments
          .filter((deployment) => deployment.rule)
          .forEach(async (deployment) => {
            const deleteURL = deploymentURL(project.name) + "/" + deployment.id;
            console.log("DELETE " + deleteURL);
            const response = await fetch(deleteURL, {
              method: "DELETE",
              headers,
            });
            await handleErrors(response, deployment);
          });

        async function handleErrors(
          response: Response,
          deployment: Deployment
        ) {
          if (response.status != 200) chalk.level = 1;
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
      }
    }
  }
  console.log("\nDone");
  return new Response("OK", { status: 200 });
}

function computeIndex(now: number, date: Date) {
  return (
    Math.trunc(
      (now - new Date(date.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    ) +
    date.getHours() +
    date.getMinutes()
  );
}

function showProjects(
  allProjects: import("/home/ergberg/node/workers/cloudflare-pages-cleanup/src/project").Project[]
) {
  DEBUG &&
    console.log(
      "\nProjects:\n" +
        tableString(allProjects, [{ name: "", align: "right" }, "name"], {
          index: allProjects.map((_, idx) => `${idx + 1}.`),
        })
    );
}

function showRules() {
  DEBUG && console.log("\nRules:\n" + tableString(rules));
}
