import { auth } from "@clerk/nextjs/server"
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  // Event submission image upload - no auth required (public submission)
  eventImage: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // No auth required for event submissions
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl || file.url }
    }),

  activityImage: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError("Unauthorized")

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl || file.url }
    }),

  // Completion card photo upload
  completionCardPhoto: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError("Unauthorized")

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl || file.url }
    }),

  // Generated completion card image upload
  completionCardGenerated: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError("Unauthorized")

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl || file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
