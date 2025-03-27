import { NextRequest, NextResponse } from 'next/server'
import { checkFileExists } from '@/lib/google-drive'

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

    const exists = await checkFileExists(accessToken, refreshToken, fileId)
    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error checking file existence:', error)
    return NextResponse.json(
      { error: 'Failed to check file existence' },
      { status: 500 }
    )
  }
} 