// app/api/config/route.ts

import { NextResponse } from 'next/server'

export async function GET (): Promise<NextResponse> {
  const endpoint =
    process.env.RUNTIME_GRAPHQL_ENDPOINT !== undefined
      ? process.env.RUNTIME_GRAPHQL_ENDPOINT
      : 'http://localhost:3000/api/v1/graphql'

  return NextResponse.json({
    graphqlEndpoint: endpoint
  })
}
