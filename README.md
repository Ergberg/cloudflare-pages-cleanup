# cloudflare-pages-cleanup

Automatically delete old deployments at Cloudflare Pages.

When you use Cloudflare Pages you know that deployments pile up rapidly and manual deletion is 
tiring.

This package provides a Cloudflare worker that reduces the pile of old deployments on Cloudflare Pages.


You can specify _n_, the number of deployments you want to keep.

The worker will delete all but the _n_ most recent deployments on each branch.

## Installation

Cloudflare's `wrangler` CLI is a prerequisite for installation. When you use Pages, you probably have wrangler already set up. 

* Use `wrangler` to set the two secrets documented in the configuration section
* Run `wrangler publish` (in this directory) to install the worker on Cloudflare.


## Configuration

The configuration of the worker requires three values:
 * account_id,
 * CLOUDFLARE_API_TOKEN, 
 * numberOfVersionsToKeep.

 `numberOfVersionsToKeep` is set in the [vars] section of the `wrangler.toml` file.


The other two values must be set as worker secrets using \
`wrangler secret put account_id` and \
`wrangler secret put CLOUDFLARE_API_TOKEN` \

 Your account_id (Account ID) is shown in the middle of the right column on Cloudflare's Worker page 
 (on https://dash.cloudflare.com/ select "Workers" from the left sidebar navigation).
 
 CLOUDFLARE_API_TOKEN needs at least the edit permission on [Account] / [Cloudflare Pages].

 You can create such a token on
 https://dash.cloudflare.com/profile/api-tokens. 
 The template "Edit Cloudflare Workers" can be used, as it includes the required permission.

If not changed, the worker will run at 9pm each day. This can be altered at the bottom of the `wrangler.toml` file.

The worker will clean all your projects. If you only want to clear specific projects named _project_name1_, _project_name2_, ..., apply the following change to src/index.ts.

```diff
< const projectIDs = await fetchProjectIDs(env);
---
> const projectIDs = ["project_name1", "project_name2", ...]; 
```

## Further Background
Read more about the background of [Cloudflare Pages Cleanup](https://blog.ergberg.tk/function/cicd#cleaning-up-old-pages-deployments) on [https://blog.ergberg.tk](https://blog.ergberg.tk).
