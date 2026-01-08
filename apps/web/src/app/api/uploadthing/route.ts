import { createRouteHandler } from "uploadthing/next"

import { ourFileRouter } from "./core"

export const dynamic = 'force-dynamic'

// Route handler for UploadThing (config is automatically picked up from env vars)
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})
