// ============================================
// 5. app/api/auth/verify/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    try {
      await jose.jwtVerify(token, secret);
      return NextResponse.json(
        { authenticated: true },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}