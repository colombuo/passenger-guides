import {readFile} from 'node:fs/promises'
import {github, installationToken} from './app-client.mjs'

const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'))
const source = event.workflow_run
if (!source?.head_sha) throw new Error('Publisher context is incomplete')
const token = await installationToken('colombuo')
const pulls = await github('/repos/colombuo/passenger-guides/pulls?state=open&per_page=100', token)
const pull = pulls.find((entry) => entry.head.sha === source.head_sha)
if (!pull) throw new Error('No open guide pull request matches the checked revision')

const previewUrl = `https://github.com/colombuo/passenger-guides/actions/runs/${process.env.GITHUB_RUN_ID}`
await github(`/repos/colombuo/passenger-guides/pulls/${pull.number}/reviews`, token, 'POST', {
  body: `The guide preview for ${source.head_sha.slice(0, 7)} is available in [the publisher run](${previewUrl}). The rendered page is attached as \`guide-preview-html\`.`,
  event: 'COMMENT'
})
process.stdout.write(`Published guide preview for PR #${pull.number}\n`)
