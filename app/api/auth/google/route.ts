import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Store both access token and refresh token in secure HTTP-only cookies
    const response = NextResponse.json({ success: true })
    
    // Store access token
    response.cookies.set('google_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    })

    // Store refresh token
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return response
  } catch (error) {
    console.error('Error getting Google tokens:', error)
    return NextResponse.json({ error: 'Failed to get tokens' }, { status: 500 })
  }
}

// Add a new endpoint to refresh the access token
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('google_refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      )
    }

    // Set the refresh token
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    // Get new tokens
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    // Store the new access token
    const response = NextResponse.json({ success: true })
    response.cookies.set('google_access_token', credentials.access_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    })

    return response
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
} 