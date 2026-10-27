export function billingReadiness(env=process.env){
  const stripeSecretConfigured=Boolean(String(env?.STRIPE_SECRET_KEY||'').trim());
  const webhookSecretConfigured=Boolean(String(env?.STRIPE_WEBHOOK_SECRET||'').trim());
  return Object.freeze({
    provider:'stripe',
    stripeSecretConfigured,
    webhookSecretConfigured,
    selfServeAvailable:stripeSecretConfigured&&webhookSecretConfigured,
    state:stripeSecretConfigured&&webhookSecretConfigured?'ready':'blocked'
  });
}

export function requireBillingReady(env=process.env){
  const readiness=billingReadiness(env);
  if(!readiness.selfServeAvailable){
    const error=new Error('BILLING_NOT_CONFIGURED');
    error.code='BILLING_NOT_CONFIGURED';
    error.readiness=readiness;
    throw error;
  }
  return readiness;
}

export async function checkoutStatus(sessionId,{store,fetchFn=globalThis.fetch,env=process.env}={}){
  const response=await fetchFn('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(sessionId),{headers:{authorization:'Bearer '+env.STRIPE_SECRET_KEY}});
  if(!response.ok)throw Error('SESSION_UNAVAILABLE');
  const session=await response.json();
  const subId=typeof session.subscription==='string'?session.subscription:session.subscription?.id;
  const sub=subId?await store.findSubscription(subId):null;
  const ready=session.status==='complete'&&['active','trialing'].includes(sub?.status)&&sub?.metadata?.checkout_session_id===sessionId;
  return {ready,state:ready?'ready':session.status==='expired'?'expired':'provisioning'};
}
