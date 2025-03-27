import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json()
    const accessToken = request.cookies.get('google_access_token')?.value
    const refreshToken = request.cookies.get('google_refresh_token')?.value

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      )
    }

    // Set the credentials including refresh token
    oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // Initialize the Google Drive API client
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Delete the file
    await drive.files.delete({
      fileId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error)
    return NextResponse.json(
      { error: 'Failed to delete file from Google Drive' },
      { status: 500 }
    )
  }
} 