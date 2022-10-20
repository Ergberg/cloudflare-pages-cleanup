import { Deployment } from "./deployments";
import { tableString } from "table-string";
import { fetchList } from "./fetch";

export type Project = {
  name: string;
  allDeployments: Deployment[];
};

export async function projects(): Promise<Project[]> {
  return fetchList("/pages/projects") as Promise<Project[]>;
}

export function showProjects(allProjects: import("./projects").Project[]) {
  console.log(
    "\nProjects:\n" +
      tableString(allProjects, [{ name: "", align: "right" }, "name"], {
        index: allProjects.map((_, idx) => `${idx + 1}.`),
      })
  );
}
