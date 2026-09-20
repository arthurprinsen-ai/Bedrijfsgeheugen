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
