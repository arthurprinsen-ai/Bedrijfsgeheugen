export function releaseCommit(env = process.env) {
  return String(env.COMMIT_REF || env.GITHUB_SHA || env.BG_RELEASE_COMMIT || 'local').trim();
}

export function ensureReleaseMarker(input, commit = releaseCommit()) {
  let html = String(input);
  const veilig = String(commit).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const meta = `<meta name="bg-release-commit" content="${veilig}">`;
  if (/<meta\b[^>]*name="bg-release-commit"[^>]*>/i.test(html)) {
    return html.replace(/<meta\b[^>]*name="bg-release-commit"[^>]*>/i, meta);
  }
  return html.includes('</head>') ? html.replace('</head>', `${meta}\n</head>`) : html;
}

export function readReleaseMarker(html) {
  const m = String(html).match(/<meta\b[^>]*name="bg-release-commit"[^>]*content="([^"]+)"[^>]*>/i)
    || String(html).match(/<meta\b[^>]*content="([^"]+)"[^>]*name="bg-release-commit"[^>]*>/i);
  return m ? m[1] : null;
}
