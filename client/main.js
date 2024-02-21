import 'htmx.org'

void {
  ...import.meta.glob('/**/*.jsx')
}

document.addEventListener('htmx:configRequest', ({ detail }) => {
  if (detail.elt.hasAttribute('hx-include-inner')) {
    detail.parameters['innerHTML'] = detail.elt.innerHTML
  }
})
