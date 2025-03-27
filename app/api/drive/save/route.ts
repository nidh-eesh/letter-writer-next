import { NextRequest, NextResponse } from 'next/server'
import { saveToDrive } from '@/lib/google-drive'

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()
    const accessToken = request.cookies.get('google_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Google' },
        { status: 401 }
      )
    }

    const file = await saveToDrive(accessToken, { title, content })
    return NextResponse.json(file)
  } catch (error) {
    console.error('Error saving to Google Drive:', error)
    return NextResponse.json(
      { error: 'Failed to save to Google Drive' },
      { status: 500 }
    )
  }
} 