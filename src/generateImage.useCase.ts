import { randomUUID } from 'node:crypto'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import OpenAI from 'openai'
import Joi from 'joi'

const args = process.argv || []
const prompt = args[2] || ''
const size = args[3] || 'auto'
const quality = args[4] || 'auto'
const output_format = args[5] || 'png'

const inputSchema = Joi.object({
  prompt: Joi.string().min(1).required(),
  size: Joi.string()
    .valid('1024x1024', '1536x1024', '1024x1536', 'auto')
    .default('auto'),
  quality: Joi.string()
    .valid('auto', 'low', 'medium', 'high')
    .default('auto'),
  output_format: Joi.string()
    .valid('png', 'jpeg', 'webp')
    .default('png')
})
.options({
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true
})

async function main() {
  const data = await inputSchema.validateAsync({ prompt, size, quality, output_format }) as {
    prompt: OpenAI.ImageGenerateParamsNonStreaming['prompt']
    size: OpenAI.ImageGenerateParamsNonStreaming['size']
    quality: OpenAI.ImageGenerateParamsNonStreaming['quality']
    output_format: OpenAI.ImageGenerateParamsNonStreaming['output_format']
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.images.generate({
    model: 'gpt-image-2',
    prompt: data.prompt,
    size: data.size,
    quality: data.quality,
    output_format: data.output_format
  })

  if (!response.data || !response.data[0] || !response.data[0].b64_json) {
    throw new Error('No image data returned from OpenAI API')
  }

  const filename = `image_${randomUUID().replaceAll('-', '')}.${data.output_format}`

  const imageBase64 = response.data[0].b64_json
  const storageDir = path.join(import.meta.dirname, 'storage')
  await fsPromises.mkdir(storageDir, { recursive: true })
  await fsPromises.writeFile(path.join(storageDir, filename), Buffer.from(imageBase64, 'base64'))

  return {
    filename,
    path: path.join(storageDir, filename),
  }
}

main()
  .then(console.log)
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })