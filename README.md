# cloudflare-pages-cleanup

Automatically delete old deployments at Cloudflare Pages.

When you use Cloudflare Pages you know that deployments pile up rapidly and manual deletion is 
tiring.

This package provides a Cloudflare worker that reduces the pile of old deployments on Cloudflare Pages.

Read more about the background of [Cloudflare Pages Cleanup](https://blog.ergberg.tk/function/cicd#cleaning-up-old-pages-deployments) on [https://blog.ergberg.tk](https://blog.ergberg.tk).

## Installation

The steps to configure the worker are:
0. Run `git clone https://github.com/ergberg/cloudflare-pages-cleanup && cd cloudflare-pages-cleanup`.
1. Run `npm install`.
2. Create an API token using the Cloudflare dashboard (or select a fitting existing one)\
   The API token must at least support the edit permission on [Account] / [Cloudflare Pages].
   You can create such a token on https://dash.cloudflare.com/profile/api-tokens. 
   The template "Edit Cloudflare Workers" can be used, as it includes the required permission.
3. Run `npx wrangler login` to login.
4. Lookup your account_id (Account ID) by running `npx wrangler whoami`.
5. Use the values from steps 2 & 4 above to set the secrets by running:\
   `npx wrangler secret put account_id`\
   `npx wrangler secret put CLOUDFLARE_API_TOKEN`
6. Approve or edit the [configuration](#configuration) starting at line 10 of the `wrangler.toml` file 
7. Optional: Change the schedule of the worker at line 55 of the `wrangler.toml` file
8. Publish the worker by running `npm run publish`.
9. Optional: Manually triggered test: run `npx wrangler tail` to watch the worker's output. In another window, trigger the cleanup manually by running `curl -s https://https://cloudflare_pages_cleanup.[your-subdomain].workers.dev`. The correct URL for your subdomain is shown as part of the output from step 8.

## Configuration

The configuration if given in TOML format. You can define different rules for groups of projects and branches. For each existing deployment, the list of rules is searched from top to bottom. The first matching rule wins.

```toml
[[rules]]                # the default rule
                         # as no "branches" or "projects" are defined, 
                         # this is a catch all for any deployment 
name = "default"         # optional, a name for debugging 
maxVersions = 5          # not more than 5 versions on any branch of any project
maxDays = 30             # and none of these older than 30 days

# What follows are examples for more elaborated rules.
# Remember to insert such rules above the catch all rule if you want them to take effect.
# Down here they will never be executed because the above rule matches all projects and all branches.

[[rules]]                # This rule will prevent deletion of deployments 
                         # for the main branch of the blog project
name = "blog_production" # optional, a name for debugging
projects = "blog"        # only for the "blog" project
branches = "main"        # matches only the main branch
maxDays = inf            # can be omitted: do not delete deployments based on age
maxVersions = inf        # can be omitted: do not delete deployments based on number of versions 

[[rules]]                # All other projects main branches
name = "production"      # optional, a name for debugging
projects = ".*"          # can be omitted: matches all projects
branches = "main"        # matches only the main branch
maxDays = 90             # keep everything younger than 90 days, (no limit on number of versions)

[[rules]]                # for all bugfix branches of the plugin projects
name = "bugfix"          # optional, a name for debugging
projects = ".*-plugin"   # matches all projects where the name ends with "-plugin"
branches = "bug-.*"      # matches all branches where the name starts with "bug-"
maxVersions = 5          # keep at most 5 versions, no matter how old
```

- The rule names are arbitrary TOML bare keys (`[A-Za-z0-0_-]*`).
- The `projects` entry is a regular expression to match the project names covered by the rule.\
  Not defining projects in a rule is equivalent to `projects = ".*"`.
- The `branches` entry is a regular expression to match the branch names covered by the rule.\
  Not defining branches in a rule is equivalent to `branches = ".*"`.
- `maxDays` defines the maximum age of a deployment on a branch of a project (in days).\
  Not defining maxDays in a rule is equivalent to `maxDays = inf` for infinite age.
- `maxVersions` is the maximum number of deployments that will survive on a branch of a project.\
  Not defining maxVersions is equivalent to `maxVersions = inf`, i.e. an infinite number of versions.


## Example Log Output 

When tailing the log with `npx wrangler tail` the output looks like this:

1. The a dump of the rules from `wrangler.toml` with all short cuts replaced
2. The list of all projects found
3. Per project, the list of deployments found. The last column shows which cleanup rule matches that deployment. An empty cell means that this deployment will not be deleted because no cleanup rule matches.
4. It is not uncommon that <span style="color:red">some deployments can not be deleted</span> even though a rule matches. A typical reason is that you can not delete a deployment that is actually active. In that case, a error message shows up in the log.

```
Rules:
┌─────────────────┬─────────────┬──────────┬───────────┬──────────┐
│      name       │ maxVersions │ maxDays  │ projects  │ branches │
├─────────────────┼─────────────┼──────────┼───────────┼──────────┤
│ default         │           5 │       30 │ .*        │ .*       │
│ blog_production │    Infinity │ Infinity │ blog      │ main     │
│ rule-2          │    Infinity │       90 │ .*        │ main     │
│ bugfix          │           5 │ Infinity │ .*-plugin │ bug-.*   │
└─────────────────┴─────────────┴──────────┴───────────┴──────────┘

Projects:
┌────┬───────┐
│    │ name  │
├────┼───────┤
│ 1. │ blog  │
│ 2. │ entry │
└────┴───────┘

entry:
┌────┬───────┬─────────────┬─────────────────────────────┬─────────┐
│    │  id   │   branch    │            as of            │  rule   │
├────┼───────┼─────────────┼─────────────────────────────┼─────────┤
│ 1. │ 2...3 │ main        │ 2022-08-17T14:09:12.697376Z │ default │
│ 2. │ 2...8 │ development │ 2022-08-17T14:08:48.428314Z │ default │
└────┴───────┴─────────────┴─────────────────────────────┴─────────┘
DELETE https://api.cloudflare.com/client/v4/accounts/9...e/pages/projects/entry/deployments/2...3
DELETE https://api.cloudflare.com/client/v4/accounts/9...e/pages/projects/entry/deployments/2...8
3:11:01 PM GET / 200

400 / Bad Request
DELETE 2...8
┌─────────┬──────────────────────────────────┐
│  code   │             message              │
├─────────┼──────────────────────────────────┤
│ 8000035 │ Cannot delete aliased deployment │
└─────────┴──────────────────────────────────┘

400 / Bad Request
DELETE 2...3
┌─────────┬────────────────────────────────────────────┐
│  code   │                  message                   │
├─────────┼────────────────────────────────────────────┤
│ 8000034 │ Cannot delete active production deployment │
└─────────┴────────────────────────────────────────────┘
```
