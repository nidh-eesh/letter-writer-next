import { google } from 'googleapis'
import type { drive_v3 } from 'googleapis'

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)

async function refreshTokenIfNeeded(accessToken: string, refreshToken: string) {
  try {
    // Set the credentials
    oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // Try to refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    return credentials.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw error
  }
}

async function getOrCreateLettersFolder(accessToken: string, refreshToken: string) {
  try {
    // Refresh token if needed
    await refreshTokenIfNeeded(accessToken, refreshToken)

    // Initialize the Drive client with current credentials
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Search for the Letters folder
    const response = await drive.files.list({
      q: "name = 'Letters' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    // If the folder exists, return its ID
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id
    }

    // If the folder doesn't exist, create it
    const folder = await drive.files.create({
      requestBody: {
        name: 'Letters',
        mimeType: 'application/vnd.google-apps.folder',
      } as drive_v3.Schema$File,
    })

    if (!folder.data.id) {
      throw new Error('Failed to create Letters folder')
    }

    return folder.data.id
  } catch (error) {
    console.error('Error getting/creating Letters folder:', error)
    throw error
  }
}

export async function saveToDrive(accessToken: string, refreshToken: string, file: { title: string, content: string }) {
  try {
    // Refresh token if needed
    await refreshTokenIfNeeded(accessToken, refreshToken)

    // Initialize the Drive client with current credentials
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Get or create the Letters folder
    const folderId = await getOrCreateLettersFolder(accessToken, refreshToken)

    // Create a new file in the Letters folder
    const response = await drive.files.create({
      requestBody: {
        name: file.title,
        mimeType: 'application/vnd.google-apps.document',
        parents: [folderId], // Save in the Letters folder
      } as drive_v3.Schema$File,
      media: {
        mimeType: 'text/html',
        body: file.content,
      },
    })

    if (!response.data) {
      throw new Error('Failed to create file in Google Drive')
    }

    return response.data
  } catch (error) {
    console.error('Error saving to Google Drive:', error)
    throw error
  }
}

export async function checkFileExists(accessToken: string, refreshToken: string, fileId: string) {
  try {
    // Refresh token if needed
    await refreshTokenIfNeeded(accessToken, refreshToken)

    // Initialize the Drive client with current credentials
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Try to get the file
    const response = await drive.files.get({
      fileId,
      fields: 'id',
    })

    return !!response.data
  } catch (error) {
    // If we get a 404 error, the file doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      return false
    }
    throw error
  }
} 