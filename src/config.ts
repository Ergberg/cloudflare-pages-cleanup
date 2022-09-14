import { parse } from "@ltd/j-toml";

export interface Env {
  config: string;
  account_id: string; // your account id. Set using "wrangler secret put"
  CLOUDFLARE_API_TOKEN: string; // a token that allows access to the API. Set using "wrangler secret put"
}
export type Rule = {
  name: string;
  projects: string;
  branches: string;
  maxDays: number;
  maxVersions: number;
};

export let accountID: string;
export let accountAPI: string;
export let headers: { Authorization: string };
export let rules: Rule[];

export function setEnv(env: Env) {
  accountID = env.account_id;
  accountAPI = `https://api.cloudflare.com/client/v4/accounts/${accountID}`;
  headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };
  rules = parse(env.config).rules as any;
  rules.forEach((rule, idx) => {
    if (!rule.name) rule.name = `rule-${idx}`;
    if (!rule.projects) rule.projects = ".*";
    if (!rule.branches) rule.branches = ".*";
    if (!rule.maxDays) rule.maxDays = Infinity;
    if (!rule.maxVersions) rule.maxVersions = Infinity;
  });
}
