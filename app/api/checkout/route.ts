import { NextRequest, NextResponse } from 'next/server'
import { mp, Preference } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const { productId, productName, price, quantity = 1 } = await req.json()

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const preference = new Preference(mp)

    const response = await preference.create({
      body: {
        items: [{
          id: productId,
          title: productName,
          quantity,
          unit_price: price,
          currency_id: 'CLP',
        }],
        back_urls: {
          success: `${baseUrl}/shop/success`,
          failure: `${baseUrl}/shop/drop01`,
          pending: `${baseUrl}/shop/drop01`,
        },
        auto_return: 'approved',
        metadata: { productId }
      }
    })

    return NextResponse.json({ url: response.init_point })
  } catch (error: any) {
    console.error('MercadoPago error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
