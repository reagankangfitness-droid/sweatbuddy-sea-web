import { auth } from "@clerk/nextjs/server"
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  // Event submission image upload - no auth required (public submission)
  eventImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // No auth required for event submissions
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Event image upload complete:", file.url)
      return { url: file.url }
    }),

  // PayNow QR code upload - no auth required (public submission)
  paynowQrUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      // No auth required for event submissions
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log("PayNow QR upload complete:", file.url)
      return { url: file.url }
    }),

  activityImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError("Unauthorized")

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId)
      console.log("file url", file.url)

      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Completion card photo upload
  completionCardPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError("Unauthorized")

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Completion card photo uploaded for userId:", metadata.userId)
      console.log("file url", file.url)

      return { uploadedBy: metadata.userId, url: file.url }
    }),

  // Generated completion card image upload
  completionCardGenerated: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError("Unauthorized")

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Generated card uploaded for userId:", metadata.userId)
      console.log("file url", file.url)

      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
