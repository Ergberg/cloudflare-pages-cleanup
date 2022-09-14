# cloudflare-pages-cleanup

Automatically delete old deployments at Cloudflare Pages.

When you use Cloudflare Pages you know that deployments pile up rapidly and manual deletion is 
tiring.

This package provides a Cloudflare worker that reduces the pile of old deployments on Cloudflare Pages.

## Installation

The steps to configure the worker are:
1. Create an API token using the Cloudflare dashboard (or select a fitting existing one)\
   The API token must at least support the edit permission on [Account] / [Cloudflare Pages].
   You can create such a token on https://dash.cloudflare.com/profile/api-tokens. 
   The template "Edit Cloudflare Workers" can be used, as it includes the required permission.
2. If you are not already logged in, run `npx wrangler login` in the actual directory.
3. Lookup your account_id (Account ID) by running `npx wrangler whoami`
4. Use the values from steps 1 & 3 to set the secrets by running:\
   `npx wrangler secret put account_id`\
   `npx wrangler secret put CLOUDFLARE_API_TOKEN`
5. Approve or edit the configuration starting at line 26 of the `wrangler.toml` file 
6. Optional: Change the schedule of the worker in line 50 of the `wrangler.toml` file
7. Publish the worker by running `npm run publish`
8. Optional: run `npx wrangler tail` to watch the worker and trigger it with `curl URL`

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

