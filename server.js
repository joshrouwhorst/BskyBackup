// server.js
const https = require('https')
const fs = require('fs')
const next = require('next')

const dev = true
const app = next({ dev })
const handle = app.getRequestHandler()
const port = Number(process.env.PORT || 3000)

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_FILE),
  cert: fs.readFileSync(process.env.SSL_CERT_FILE),
}

app.prepare().then(() => {
  https
    .createServer(httpsOptions, (req, res) => handle(req, res))
    .listen(port, () => {
      console.log(`HTTPS server listening on https://localhost:${port}`)
    })
})
