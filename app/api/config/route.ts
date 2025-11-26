// app/api/config/route.ts

import { NextResponse } from 'next/server'

export async function GET () {
  return NextResponse.json({
    graphqlEndpoint: process.env.RUNTIME_GRAPHQL_ENDPOINT || 'http://localhost:3000/api/v1/graphql'
  })
}
