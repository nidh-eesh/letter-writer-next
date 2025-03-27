import { google } from 'googleapis'

// Initialize the Google Drive API client
const drive = google.drive('v3')

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)

// Set up the Google Drive API client
const driveClient = drive.drive({
  version: 'v3',
  auth: oauth2Client,
})

export async function saveToDrive(accessToken: string, file: { title: string, content: string }) {
  try {
    // Set the access token
    oauth2Client.setCredentials({ access_token: accessToken })

    // Create a new file
    const response = await driveClient.files.create({
      requestBody: {
        name: file.title,
        mimeType: 'application/vnd.google-apps.document',
      },
      media: {
        mimeType: 'text/html',
        body: file.content,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error saving to Google Drive:', error)
    throw error
  }
} 