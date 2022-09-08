/*
This Worker reduces the pile of old deployments on Cloudflare Pages.
You can specify _n_, the number of deployments you want to keep.

The worker will delete all but the _n_ most recent deployments on each branch.

The worker will clean all your projects. If you only want to clear specific projects, replace

< const projectIDs = await fetchProjectIDs(env);
--- with
> const projectIDs = ["project_name1", "project_name2", ...]; 

Copyright (c) 2022, Ergberg
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 

*/

export interface Env {
  numberOfVersionsToKeep: string; // how many deployments to keep for each branch. Set in wrangler.toml
  CLOUDFLARE_API_TOKEN: string; // a token that allows access to the API. Set using "wrangler secret put"
  account_id: string; // your account id. Set using "wrangler secret put"
}
export default {
  fetch(request: Request, env: Env, context: any) {
    return cleanUp(env);
  },
  scheduled(event: Event, env: Env, context: any) {
    context.waitUntil(cleanUp(env));
  },
};

type Deployment = {
  created_on: string;
  id: string;
  deployment_trigger: { metadata: { branch: string } };
};
type Deployments = {
  result: Deployment[];
  result_info: { count: number; total_count: number };
};
type Project = {
  name: string;
};
type Projects = {
  result: Project[];
  result_info: { count: number; total_count: number };
};

async function cleanUp(env: Env) {
  const deploymentsEndpoint =
    "https://api.cloudflare.com/client/v4/accounts/" +
    env.account_id +
    "/pages/projects/PROJECT_ID/deployments";

  const headers = {
    Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
  };

  async function fetchProjectIDs(env: Env): Promise<string[]> {
    const projectsEndpoint =
      "https://api.cloudflare.com/client/v4/accounts/" +
      env.account_id +
      "/pages/projects";

    let allProjectIDs: string[] = [];
    let names = [];
    let projects: Projects;
    let page = 0;
    do {
      const url = projectsEndpoint + `?page=${++page}`;
      console.log("url :>> ", url);
      const res = await fetch(url, { headers });
      projects = await res.json();

      if (projects?.result?.length) {
        names = projects.result.map((p) => p.name);
        allProjectIDs = [...allProjectIDs, ...names];
      }
    } while (
      names.length &&
      allProjectIDs.length < projects.result_info.total_count
    );
    return allProjectIDs;
  }

  const versionsToKeep = parseInt(env.numberOfVersionsToKeep, 10);
  const projectIDs = await fetchProjectIDs(env);
  projectIDs.forEach((name) => console.log(name));

  for (let i in projectIDs) {
    const projectID = projectIDs[i];
    const deploymentsURL = deploymentsEndpoint.replace("PROJECT_ID", projectID);

    const deployments = await fetchDeployments();
    deployments.forEach((deployment) =>
      console.log(
        `Found ${deployment.id} as of ${deployment.created_on} on ${deployment.deployment_trigger.metadata.branch}`
      )
    );
    const seen: Record<string, number> = {};
    for (let j = 0; j < deployments.length; ++j) {
      const deployment = deployments[j];
      const branch = deployment.deployment_trigger.metadata.branch;
      seen[branch] = (seen[branch] ? seen[branch] : 0) + 1;
      if (seen[branch] > versionsToKeep) {
        const deleteURL = deploymentsURL + "/" + deployment.id;
        console.log("deleting ", deleteURL);
        const response = await fetch(deleteURL, { method: "DELETE", headers });
        if (response.status != 200) return response;
      }
    }

    async function fetchDeployments(): Promise<Deployment[]> {
      let allDeployments: Deployment[] = [];
      let onThisPage;
      let json: Deployments;
      let page = 0;
      do {
        const url = deploymentsURL + `?page=${++page}`;
        console.log("url :>> ", url);
        const fetched = await fetch(url, { headers });
        json = await fetched.json();
        onThisPage = json?.result ?? [];
        allDeployments = [...allDeployments, ...onThisPage];
      } while (
        onThisPage.length &&
        allDeployments.length < json.result_info.total_count
      );
      return allDeployments;
    }
  }
  return new Response("OK", { status: 200 });
}
