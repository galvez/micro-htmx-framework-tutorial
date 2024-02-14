const routeHash = import.meta.glob('/views/**/*.js', { eager: true })

for (const [path, route] of Object.entries(routeHash)) {
  routeHash[path] = { ...route }
  routeHash[path].modulePath = path
}

export const routes = Object.values(routeHash)
