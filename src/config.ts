import { parse } from "@ltd/j-toml";
import { tableString } from "table-string";

export interface Env {
  config: string;
  project_id: string; // the name of one project, leave undefined to iterate over all your projects
  account_id: string; // your account id. Set using "wrangler secret put"
  CLOUDFLARE_API_TOKEN: string; // a token that allows access to the API. Set using "wrangler secret put"
  DEBUG: string; // "true" for debug output, anything else for none.
}
export type Rule = {
  name: string;
  projects: string;
  branches: string;
  maxDays: number;
  maxVersions: number;
};

export let accountID: string;
export let projectID: string;
export let accountAPI: string;
export let headers: { Authorization: string };
export let rules: Rule[];
export let DEBUG: boolean;

export function setEnv(env: Env) {
  accountID = env.account_id;
  projectID = env.project_id;
  accountAPI = `https://api.cloudflare.com/client/v4/accounts/${accountID}`;
  headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };
  DEBUG = env.DEBUG === "true";
  rules = parse(env.config).rules as any;
  rules.forEach((rule, idx) => {
    if (!rule.name) rule.name = `rule-${idx}`;
    if (!rule.projects) rule.projects = ".*";
    if (!rule.branches) rule.branches = ".*";
    if (!rule.maxDays) rule.maxDays = Infinity;
    if (!rule.maxVersions) rule.maxVersions = Infinity;
  });
}

export function showRules() {
  console.log("\nRules:\n" + tableString(rules));
}
