import { NextRequest, NextResponse } from 'next/server'
import { saveToDrive } from '@/lib/google-drive'

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value
    const refreshToken = request.cookies.get('google_refresh_token')?.value

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      )
    }

    const { title, content } = await request.json()

    try {
      const file = await saveToDrive(accessToken, refreshToken, { title, content })
      return NextResponse.json(file)
    } catch (error: any) {
      // If re-authentication is required, return a specific status code
      if (error.message === 'REAUTH_REQUIRED') {
        return NextResponse.json(
          { error: 'REAUTH_REQUIRED' },
          { status: 401 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error saving to Google Drive:', error)
    return NextResponse.json(
      { error: 'Failed to save to Google Drive' },
      { status: 500 }
    )
  }
} 