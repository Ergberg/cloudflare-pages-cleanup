/*
This worker automatically deletes old deployments on Cloudflare Pages.
Which deployments to keep can be configured in the wrangler.toml file.

Copyright (c) 2022, Ergberg
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 
*/
import { setEnv, Env } from "./config";
import cleanUp from "./cleanUp";

export default {
  fetch(request: Request, env: Env, context: any) {
    setEnv(env);
    return cleanUp(context.waitUntil.bind(context));
  },
  scheduled(event: Event, env: Env, context: any) {
    setEnv(env);
    return cleanUp(context.waitUntil.bind(context));
  },
};
