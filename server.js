import express from "express"
import axios from "axios"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())

app.post("/api/proxy", async (req, res) => {

  try {

    const { url, method, data, params } = req.body

    const response = await axios({
      url,
      method,
      data,
      params
    })

    res.json(response.data)

  } catch (error) {

    console.error("Proxy error:", error.message)

    res.status(500).json({
      error: "Proxy error"
    })

  }

})

const PORT = 3001

app.listen(PORT, () => {

  console.log(`🚀 Proxy rodando em http://localhost:${PORT}`)

})