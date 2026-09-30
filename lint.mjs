import {readdir, readFile} from 'node:fs/promises'
import {compile} from '@mdx-js/mdx'

for (const name of (await readdir('guides')).filter((entry) => entry.endsWith('.mdx')).sort()) {
  await compile(await readFile(`guides/${name}`, 'utf8'))
  process.stdout.write(`${name}: valid MDX\n`)
}
