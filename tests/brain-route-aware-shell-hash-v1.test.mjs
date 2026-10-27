import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHash } from '../tools/site-shell/contracts.mjs';

function page({nlHref,enHref,nlCurrent,enCurrent,menuHref='/prijzen'}) {
  return `<aside data-bg-component="mobile-menu" class="v18-mobile-drawer">
    <a href="${menuHref}">Prijzen</a>
    <nav data-bg-language-switcher="mobile">
      <a href="${nlHref}" data-bg-language-option="nl" aria-current="${nlCurrent}">Nederlands</a>
      <a href="${enHref}" data-bg-language-option="en" aria-current="${enCurrent}">English</a>
    </nav>
  </aside>`;
}

test('route-bound locale href and aria-current do not create shell drift', () => {
  const a=page({nlHref:'/prijzen',enHref:'/en/prijzen',nlCurrent:'page',enCurrent:'false'});
  const b=page({nlHref:'/systemen-koppelen',enHref:'/en/systemen-koppelen',nlCurrent:'page',enCurrent:'false'});
  assert.equal(componentHash(a,'mobile-menu'),componentHash(b,'mobile-menu'));
});

test('meaningful mobile-menu navigation drift still changes the hash', () => {
  const a=page({nlHref:'/prijzen',enHref:'/en/prijzen',nlCurrent:'page',enCurrent:'false',menuHref:'/prijzen'});
  const b=page({nlHref:'/prijzen',enHref:'/en/prijzen',nlCurrent:'page',enCurrent:'false',menuHref:'/cases'});
  assert.notEqual(componentHash(a,'mobile-menu'),componentHash(b,'mobile-menu'));
});
