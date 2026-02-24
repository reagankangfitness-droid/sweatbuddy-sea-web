const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

export function buildNotificationEmail(params: {
  title: string
  body: string
  linkUrl?: string
  linkLabel?: string
  imageUrl?: string
}): string {
  const { title, body, linkUrl, linkLabel, imageUrl } = params

  const ctaButton = linkUrl
    ? `
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td align="center" style="padding: 8px;">
            <a href="${linkUrl}" style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
              ${linkLabel || 'View Details'}
            </a>
          </td>
        </tr>
      </table>
    `
    : ''

  const imageBlock = imageUrl
    ? `
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td align="center" style="padding: 0;">
            <img src="${imageUrl}" alt="" style="max-width: 100%; height: auto; border-radius: 8px;" />
          </td>
        </tr>
      </table>
    `
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px; background-color: white;">
              ${imageBlock}
              <p style="margin: 0 0 24px; color: #334155; font-size: 16px; line-height: 1.6;">
                ${body}
              </p>
              ${ctaButton}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                You're receiving this from SweatBuddies. Manage your notification preferences in your account settings.
              </p>
              <a href="${BASE_URL}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600;">
                sweatbuddies.co
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
