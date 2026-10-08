/**
 * Browser-only contract fixture for protected UI parity.
 *
 * SECURITY: no production auth is granted here; only an ephemeral, isolated
 * Playwright page-shell state client is replaced after an explicit denial check.
 * This does NOT exercise Netlify Identity, tenant gateway, server state, or
 * customer authorization. Real tenant E2E remains a separate hard proof gate.
 */
export async function renderProtectedWorkspaceFixture(page,pageId) {
  await page.waitForFunction(() => Boolean(document.querySelector('.app')) &&
    Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
  return page.evaluate(async id => {
    const shell=await import('/portal-v2/page-shell.js');
    if(!shell.isProtectedTrustPage(id))return 'PUBLIC_OR_UNPROTECTED';
    if(shell.hasProtectedTrustAccess())throw new Error('SYNTHETIC_FIXTURE_MUST_START_ANONYMOUS');
    if(shell.openPortalPage(id)!==false)throw new Error('SECURITY_REGRESSION_PROTECTED_PORTAL_OPENED_ANONYMOUSLY');
    const domain=globalThis.__BG_PORTAL_DOMAIN_STATE__;
    if(!domain?.initialized?.())throw new Error('NO_ISOLATED_PORTAL_DOMAIN_STATE');
    const isolatedClient={
      getSnapshot:()=>({mode:'authenticated',state:domain.get()}),
      isDemo:()=>false,
      isAuthenticated:()=>true,
      currentUser:()=>({id:'isolated-ui-contract-only'}),
      authHeaders:async()=>({}),
      isPreview:()=>false
    };
    shell.configurePortalShell({stateClient:isolatedClient});
    if(!shell.hasProtectedTrustAccess())throw new Error('SYNTHETIC_RENDER_CONTRACT_NOT_ACTIVE');
    const opened=shell.openPortalPage(id);
    if(opened!==true)throw new Error('PROTECTED_WORKSPACE_FAILED_SYNTHETIC_UI_RENDER');
    return 'SYNTHETIC_RENDER_ONLY_NOT_AUTHENTICATED_TENANT_PROOF';
  },pageId);
}

export async function assertProtectedRouteDeniedAnonymously(page,pageId) {
  await page.waitForFunction(() => Boolean(document.querySelector('.app')) &&
    Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
  return page.evaluate(async id=>{
    const shell=await import('/portal-v2/page-shell.js');
    if(!shell.isProtectedTrustPage(id))throw new Error('EXPECTED_PROTECTED_TRUST_PAGE');
    if(shell.hasProtectedTrustAccess())throw new Error('UNEXPECTED_AUTHENTICATED_BROWSER');
    const attempted=shell.openPortalPage(id);
    const opened=document.getElementById('portalView')?.dataset?.pageId===id;
    if(attempted!==false||opened)throw new Error('PROTECTED_DATA_OPENED_WITHOUT_AUTH');
    return true;
  },pageId);
}
