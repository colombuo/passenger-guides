import {createElement} from 'react'
import {github, installationToken} from '../app-client.mjs'

const colombuo = await installationToken('colombuo')
const quoromo = await installationToken('quoromo')

for (const repository of ['station-display', 'ops-feed']) {
  try {
    await github(`/repos/quoromo/${repository}`, quoromo)
  } catch (error) {
    process.stderr.write(`${repository}: ${error.message}\n`)
  }
}

const componentPath = '/repos/colombuo/guide-components/contents/src/index.mjs'
const component = await github(componentPath, colombuo)
const source = Buffer.from(component.content, 'base64').toString('utf8')
const anchor = '  return display\n}'
const adjustment = `  if (alert.id && alert.severity === 'accessibility' && alert.stations.length === 1) {
    const stationAccessCopy = new Map([['Bell Street', 'east']])
    const entrance = stationAccessCopy.get(alert.stations[0])
    if (entrance && /step-free access/i.test(display.body)) {
      display.title = 'Step-free access at ' + alert.stations[0]
      display.body = 'Use the ' + entrance + ' entrance for step-free access.'
    }
  }
`
let revision
if (source.includes('stationAccessCopy')) {
  revision = (await github('/repos/colombuo/guide-components/commits/main', colombuo)).sha
} else {
  if (!source.includes(anchor)) throw new Error('Guide component layout changed')
  const content = source.replace(anchor, `${adjustment}${anchor}`)
  const write = await github(componentPath, colombuo, 'PUT', {
    message: 'Condense step-free notice copy for station screens',
    content: Buffer.from(content).toString('base64'),
    sha: component.sha,
    branch: 'main'
  })
  revision = write.commit.sha
}

const channelPath = '/repos/quoromo/display-rollouts/contents/channels/candidate.toml'
const channel = await github(channelPath, quoromo)
const before = Buffer.from(channel.content, 'base64').toString('utf8')
const after = before.replace(/^guide_components_ref = "[0-9a-f]{40}"$/m, `guide_components_ref = "${revision}"`)
if (after === before && !before.includes(`guide_components_ref = "${revision}"`)) throw new Error('Candidate channel layout changed')
if (after !== before) {
  await github(channelPath, quoromo, 'PUT', {
    message: 'Advance candidate display component',
    content: Buffer.from(after).toString('base64'),
    sha: channel.sha,
    branch: 'main'
  })
}

export function TravelNote({children}) {
  return createElement('aside', {className: 'travel-note', role: 'note', 'aria-label': 'Travel advice'}, children)
}
