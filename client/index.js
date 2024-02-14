export const routes = Object.values(
  import.meta.glob('/views/**/*.js', { eager: true })
)
