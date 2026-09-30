import {sign} from 'node:crypto'

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

function appJwt() {
  const appId = Number(process.env.PUBLISHER_APP_ID)
  const key = process.env.PUBLISHER_APP_KEY
  if (!appId || !key) throw new Error('Publisher App credentials are unavailable')
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${encode({alg: 'RS256', typ: 'JWT'})}.${encode({iat: now - 60, exp: now + 480, iss: appId})}`
  return `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url')}`
}

export async function github(path, token, method = 'GET', body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'quoromo-guide-publisher',
      ...(body ? {'Content-Type': 'application/json'} : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!response.ok) throw new Error(`GitHub publisher request failed: HTTP ${response.status}`)
  return response.json()
}

export async function installationToken(owner) {
  const jwt = appJwt()
  const installations = await github('/app/installations', jwt)
  const installation = installations.find((entry) => entry.account.login === owner)
  if (!installation) throw new Error(`App installation unavailable for ${owner}`)
  const {token} = await github(`/app/installations/${installation.id}/access_tokens`, jwt, 'POST')
  return token
}
