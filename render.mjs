import {readFile, readdir, stat, mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {evaluate} from '@mdx-js/mdx'
import {jsx, jsxs, Fragment} from 'react/jsx-runtime'
import {renderToStaticMarkup} from 'react-dom/server'

const input = process.argv[2]
if (!input) throw new Error('Guide path required')
const files = (await stat(input)).isDirectory()
  ? (await readdir(input)).filter((name) => name.endsWith('.mdx')).sort().map((name) => path.join(input, name))
  : [input]
if (files.length === 0) throw new Error('No guide source found')
await mkdir('dist', {recursive: true})
for (const file of files) {
  const source = await readFile(file, 'utf8')
  const page = await evaluate(source, {jsx, jsxs, Fragment, baseUrl: pathToFileURL(path.resolve(file)).href})
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><body>${renderToStaticMarkup(jsx(page.default, {}))}</body></html>\n`
  const output = path.join('dist', `${path.basename(file, '.mdx')}.html`)
  await writeFile(output, html)
  process.stdout.write(`Rendered ${path.basename(file)}\n`)
}
