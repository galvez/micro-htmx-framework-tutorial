import 'htmx.org'

const allClientImports = { 
  ...import.meta.glob('/**/*.svg'),
  ...import.meta.glob('/**/*.css'),
  ...import.meta.glob('/**/*.client.js')
}

const clientImports = window[Symbol.for('clientImports')]

Promise.all(clientImports.map((clientImport) => {
  return allClientImports[clientImport]()
}))

document.addEventListener('htmx:configRequest', ({ detail }) => {
  if (detail.elt.hasAttribute('hx-include-inner')) {
    detail.parameters['innerHTML'] = detail.elt.innerHTML
  }
})
