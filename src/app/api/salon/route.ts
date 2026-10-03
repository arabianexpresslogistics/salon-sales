import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZjA-N5WMD-Ow6wnnjrg3vXnC95LnEezHrRpJG62u-5JBbLomyJlx0uF6aiB9NY_juLg/exec';

function getScriptUrl(req: NextRequest): string {
  const customUrl = req.headers.get('x-custom-script-url');
  if (customUrl && customUrl.startsWith('http')) {
    return customUrl;
  }
  return process.env.NEXT_PUBLIC_SALON_SCRIPT_URL || FALLBACK_SCRIPT_URL;
}

// GET: Fetch visits from Google Sheet
export async function GET(request: NextRequest) {
  let targetUrl = getScriptUrl(request);
  const searchParams = request.nextUrl.search;
  if (searchParams && !targetUrl.includes('?')) {
    targetUrl += searchParams;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      redirect: 'follow',
    });


    if (response.status === 401) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Google Script returned HTTP 401. In Google Apps Script, click Deploy > Manage deployments > Edit, and change 'Who has access' to 'Anyone' (New version)." 
        },
        { status: 200 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Google Script returned HTTP ${response.status}` },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API GET /api/salon Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch from Google Apps Script' },
      { status: 200 }
    );
  }
}

// POST: Actions: addVisit, login, getEmployees, addEmployee
export async function POST(request: NextRequest) {
  const scriptUrl = getScriptUrl(request);
  try {
    const payload = await request.json();

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (response.status === 401) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Google Script returned HTTP 401. In Google Apps Script: Click Deploy > Manage deployments > Edit pencil > Change 'Who has access' to 'Anyone' > Deploy as New Version." 
        },
        { status: 200 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Google Script returned HTTP ${response.status}` },
        { status: 200 }
      );
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, message: text };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API POST /api/salon Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to communicate with Google Apps Script' },
      { status: 200 }
    );
  }
}
