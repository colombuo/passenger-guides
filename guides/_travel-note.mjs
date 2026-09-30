import {createElement} from 'react'

export function TravelNote({children}) {
  return createElement('aside', {className: 'travel-note', role: 'note', 'aria-label': 'Travel advice'}, children)
}
