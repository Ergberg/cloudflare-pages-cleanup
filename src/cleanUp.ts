import { DEBUG, projectID, showRules } from "./config";
import { projects, showProjects } from "./projects";
import { deployments, showDeployments } from "./deployments";
import { executeDeletions, selectDeletions } from "./deletions";

const ROUND_ROBIN = "round-robin";

export default async function cleanUp(
  waitUntil: (promise: Promise<Response>) => void
) {
  showRules();

  const allProjects = await projects();
  showProjects(allProjects);

  const idx = computeIndex();
  showDebugInfo(idx);

  if (allProjects && allProjects.length > 0) {
    if (projectID === ROUND_ROBIN) {
      allProjects[0] = allProjects[idx % allProjects.length];
      allProjects.length = 1;
    }

    for (let p = 0; p < allProjects.length; ++p) {
      const project = allProjects[p];
      if (
        !projectID ||
        projectID === project.name ||
        projectID === ROUND_ROBIN
      ) {
        project.allDeployments = await deployments(project.name);
        selectDeletions(project);
        showDeployments(project);
        executeDeletions(project, waitUntil);
      }
    }
    return new Response("OK", { status: 200 });
  }
}

function computeIndex() {
  const now = new Date();
  return dayOfTheYear() + now.getHours() + now.getMinutes();

  function dayOfTheYear() {
    return Math.trunc(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }
}

function showDebugInfo(idx: number) {
  DEBUG &&
    console.log(
      projectID === ROUND_ROBIN
        ? `Using ${ROUND_ROBIN} strategy.`
        : !projectID
        ? "Cleaning all projects"
        : `Looking for project '${projectID}'.`
    );
  DEBUG && console.log("idx :>> ", idx);
}
