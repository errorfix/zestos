import { NextRequest, NextResponse } from 'next/server';
import {
  OPERATOR_COOKIE_NAME,
  getOperatorFromRequest,
  OperatorSession,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const operator = getOperatorFromRequest(request);
  return NextResponse.json({
    success: true,
    operator,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operatorName, operatorRollNo, operatorType, password } = body;

    if (!operatorName || typeof operatorName !== 'string' || !operatorName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Full name is required.' },
        { status: 400 }
      );
    }

    if (!operatorRollNo || typeof operatorRollNo !== 'string' || !operatorRollNo.trim()) {
      return NextResponse.json(
        { success: false, error: 'Roll number or Faculty ID is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification password is required.' },
        { status: 400 }
      );
    }

    const isFaculty = operatorType === 'FACULTY';
    const expectedPassword = isFaculty
      ? (process.env.OPERATOR_FACULTY_PASSWORD || 'Faculty@Zest26_Auth99')
      : (process.env.OPERATOR_STUDENT_PASSWORD || 'Student@Zest26_OpPass');

    if (password.trim() !== expectedPassword.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: isFaculty
            ? 'Incorrect Faculty In-Charge verification password.'
            : 'Incorrect Student Operator verification password.',
        },
        { status: 401 }
      );
    }

    const session: OperatorSession = {
      operatorName: operatorName.trim(),
      operatorRollNo: operatorRollNo.trim().toUpperCase(),
      operatorType: isFaculty ? 'FACULTY' : 'STUDENT',
      timestamp: Date.now(),
    };

    const serialized = encodeURIComponent(JSON.stringify(session));

    const response = NextResponse.json({
      success: true,
      operator: session,
    });

    // Save as cookie (7-day validity, accessible to client script & server APIs)
    response.cookies.set({
      name: OPERATOR_COOKIE_NAME,
      value: serialized,
      path: '/',
      maxAge: 7 * 24 * 3600,
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process operator session: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Operator session terminated.',
  });

  response.cookies.delete(OPERATOR_COOKIE_NAME);
  return response;
}
