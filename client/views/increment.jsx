export const fragment = true
export const path = '/counter'
export const method = 'POST'

export default (req) => {
  return req.body.innerHTML.replace(/count is (\d+)/, (_, count) => {
  	return `count is ${Number(count) + 1}`
  })
}
