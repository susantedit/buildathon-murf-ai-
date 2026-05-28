import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'

// Usage: node transcribe_test.js /path/to/file.wav
const args = process.argv.slice(2)
if (!args[0]) {
  console.error('Usage: node transcribe_test.js /path/to/file.wav')
  process.exit(1)
}

const filePath = path.resolve(args[0])
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath)
  process.exit(1)
}

const url = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}/api/transcribe`

async function run() {
  try {
    const form = new FormData()
    form.append('audio', fs.createReadStream(filePath))

    console.log('Posting to', url)
    const resp = await axios.post(url, form, { headers: form.getHeaders(), maxBodyLength: Infinity, timeout: 180000 })
    console.log('Response:', resp.data)
  } catch (err) {
    console.error('Error:', err?.response?.data || err.message || err)
    process.exit(1)
  }
}

run()
