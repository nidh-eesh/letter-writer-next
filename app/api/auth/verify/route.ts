import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')

    if (!session) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    // Verify the session cookie
    await adminAuth.verifySessionCookie(session.value, true)
    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    console.error('Session verification failed:', error)
    return NextResponse.json({ valid: false }, { status: 401 })
  }
} 