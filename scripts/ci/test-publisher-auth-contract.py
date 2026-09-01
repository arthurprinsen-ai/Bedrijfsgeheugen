from pathlib import Path

WORKFLOWS = Path('.github/workflows')
matched = 0

for path in WORKFLOWS.glob('*.yml'):
    text = path.read_text()
    if 'anthropics/claude-code-action@' not in text or 'git push origin "HEAD:$CANDIDATE_BRANCH"' not in text:
        continue
    matched += 1
    push = text.index('git push origin "HEAD:$CANDIDATE_BRANCH"')
    auth = text.rfind('gh auth setup-git', 0, push)
    assert auth != -1, f'{path}: candidate push lacks restored GitHub auth after Claude action'
    token = text.rfind('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}', 0, push)
    assert token != -1 and token < auth, f'{path}: auth restore lacks GITHUB_TOKEN'

assert matched > 0, 'no Claude publisher workflow found; regression test is not exercising the risk pattern'
print('PUBLISHER_AUTH_CONTRACT_OK', matched)
