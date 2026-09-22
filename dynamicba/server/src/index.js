import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import orgRoutes from './routes/orgRoutes.js'
import licenceRoutes from './routes/licenceRoutes.js'
import clientRoutes from './routes/clientRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import artifactRoutes from './routes/artifactRoutes.js'
import alertRoutes from './routes/alertRoutes.js'
import aiRoutes from './routes/aiRoutes.js'

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api', orgRoutes)
app.use('/api', licenceRoutes)
app.use('/api', clientRoutes)
app.use('/api', projectRoutes)
app.use('/api', artifactRoutes)
app.use('/api', alertRoutes)
app.use('/api', aiRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`DynamicBA API server listening on http://localhost:${port}`)
})
