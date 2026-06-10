import { NextResponse } from "next/server"

function legacyEndpointResponse() {
  return NextResponse.json(
    { data: null, error: "LEGACY_ENDPOINT_REMOVED_USE_ADMIN_USERS" },
    { status: 410 },
  )
}

export async function GET() {
  return legacyEndpointResponse()
}

export async function POST() {
  return legacyEndpointResponse()
}

export async function DELETE() {
  return legacyEndpointResponse()
}
