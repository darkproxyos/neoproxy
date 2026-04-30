import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { productId, productName, price, quantity = 1 } = await req.json()

    // If NEXTAUTH_URL is missing in .env, fallback to localhost for development
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: Math.round(price * 100),
        },
        quantity,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop/drop01`,
      metadata: { productId }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
