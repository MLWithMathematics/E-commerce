import { useCallback, useRef } from 'react'
import api from '../api/client'

/**
 * useRazorpay
 *
 * Handles the full 3-step Razorpay payment flow:
 *   1. Load Razorpay SDK script (once)
 *   2. Create an order on our backend → get razorpay_order_id
 *   3. Open Razorpay checkout modal
 *   4. On success → verify signature on our backend
 *
 * Usage:
 *   const { pay, loading } = useRazorpay()
 *   await pay({ amount, items, shipping_address, coupon_id, ... })
 */
export function useRazorpay() {
  const scriptLoaded = useRef(false)

  const loadScript = useCallback(() => {
    if (scriptLoaded.current || document.getElementById('razorpay-sdk')) {
      scriptLoaded.current = true
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      const script    = document.createElement('script')
      script.id       = 'razorpay-sdk'
      script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload   = () => { scriptLoaded.current = true; resolve() }
      script.onerror  = () => reject(new Error('Failed to load Razorpay SDK'))
      document.body.appendChild(script)
    })
  }, [])

  /**
   * pay({ amount, items, shipping_address, notes, scheduled_date, coupon_id, onSuccess, onFailure })
   * amount — final amount AFTER coupon discount (in ₹)
   */
  const pay = useCallback(async ({
    amount,
    items,
    shipping_address,
    notes,
    scheduled_date,
    coupon_id,
    onSuccess,
    onFailure,
    userEmail,
    userName,
    userPhone,
  }) => {
    await loadScript()

    // Step 1 — Create Razorpay order on backend
    let rzpOrder
    try {
      const { data } = await api.post('/razorpay/create-order', {
        amount,
        receipt: `wipsom_${Date.now()}`,
      })
      rzpOrder = data
    } catch (err) {
      onFailure?.(err.response?.data?.message || 'Could not initiate payment')
      return
    }

    // Step 2 — Open Razorpay checkout
    const options = {
      key:         rzpOrder.key,
      amount:      rzpOrder.amount,
      currency:    rzpOrder.currency,
      name:        'WipSom',
      description: `Order for ${items.length} item(s)`,
      image:       '/logo.png',
      order_id:    rzpOrder.razorpay_order_id,

      prefill: {
        name:    userName  || '',
        email:   userEmail || '',
        contact: userPhone || '',
      },

      theme: { color: '#f59e0b' },

      handler: async (response) => {
        // Step 3 — Verify on backend
        try {
          const { data: verified } = await api.post('/razorpay/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            items,
            shipping_address,
            notes,
            scheduled_date,
            coupon_id,
          })
          onSuccess?.(verified)
        } catch (err) {
          onFailure?.(err.response?.data?.message || 'Payment verification failed')
        }
      },

      modal: {
        ondismiss: () => onFailure?.('Payment cancelled'),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (res) => {
      onFailure?.(res.error?.description || 'Payment failed')
    })
    rzp.open()
  }, [loadScript])

  return { pay }
}
