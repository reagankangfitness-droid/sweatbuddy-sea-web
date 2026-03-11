import { NextResponse } from "next/server"
const GONE = () => NextResponse.json({ error: "This feature has been sunset." }, { status: 410 })
export const GET = GONE; export const POST = GONE; export const PUT = GONE; export const DELETE = GONE; export const PATCH = GONE
