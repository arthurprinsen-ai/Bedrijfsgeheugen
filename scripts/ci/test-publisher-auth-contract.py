from pathlib import Path

FILES = [
    Path('.github/workflows/weekblog.yml'),
    Path('.github/workflows/approved-central-blog.yml'),
]

for path in FILES:
    text = path.read_text()
    push = text.index('git push origin "HEAD:$CANDIDATE_BRANCH"')
    auth = text.rfind('gh auth setup-git', 0, push)
    assert auth != -1, f'{path}: candidate push lacks restored GitHub auth'
    token = text.rfind('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}', 0, push)
    assert token != -1 and token < auth, f'{path}: auth restore lacks GITHUB_TOKEN'

print('PUBLISHER_AUTH_CONTRACT_OK')
