/* Navigeren in de zijbalk van Portal V2 langs de route die een gebruiker ook loopt:
 * eerst de vraag openklappen, dan de pagina kiezen.
 *
 * Selecteert op data-page en data-vraag, nooit op zichtbare tekst. Een pagina die
 * hernoemd wordt mag geen test breken; een pagina die verdwijnt wel.
 *
 * Heet portal-v2-nav-helper.js en niet helpers/portal-nav.js, omdat elk gewijzigd pad
 * in config/brain-delivery-system.json geregistreerd moet zijn. Deze naam valt onder
 * de bestaande prefix tests/integration/portal-v2-.
 */

async function openQuestionFor(page, pageId) {
  await page.evaluate((id) => {
    const target = document.querySelector(`.nav [data-page="${id}"]`);
    if (!target) throw new Error(`Navigatie kent geen knop voor pagina "${id}"`);
    const sub = target.closest('.dvnav-sub');
    if (!sub || !sub.hidden) return;
    const question =
      (sub.id && document.querySelector(`[aria-controls="${sub.id}"]`)) ||
      sub.previousElementSibling;
    if (!question) throw new Error(`Sublijst van "${id}" heeft geen vraagknop`);
    question.click();
  }, pageId);
}

/** Klapt de juiste vraag open en klikt de pagina aan. */
async function gotoPortalPage(page, pageId) {
  await openQuestionFor(page, pageId);
  const button = page.locator(`.nav [data-page="${pageId}"]`);
  await button.waitFor({ state: 'visible', timeout: 10_000 });
  await button.click();
}

module.exports = { gotoPortalPage, openQuestionFor };
