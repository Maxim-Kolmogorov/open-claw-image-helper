import { randomUUID } from 'node:crypto'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import OpenAI, { toFile } from 'openai'
import Joi from 'joi'
import sharp from 'sharp'

const args = process.argv || []
const imagePaths = args[2] || ''
const prompt = args[3] || ''
const maskPath = args[4] || ''
const size = args[5] || 'auto'
const quality = args[6] || 'auto'
const output_format = args[7] || 'png'

const inputSchema = Joi.object({
  imagePaths: Joi.string().min(1).required(),
  prompt: Joi.string().min(1).required(),
  maskPath: Joi.string().allow('').default(''),
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

async function toPngBuffer(filePath: string) {
  return sharp(filePath).rotate().png().toBuffer()
}

function bufferToPngFile(buf: Buffer, filePath: string) {
  const name = path.basename(filePath, path.extname(filePath)) + '.png'
  return toFile(buf, name, { type: 'image/png' })
}

async function main() {
  const data = await inputSchema.validateAsync({
    imagePaths, prompt, maskPath, size, quality, output_format
  }) as {
    imagePaths: string
    prompt: OpenAI.ImageEditParamsNonStreaming['prompt']
    maskPath: string
    size: OpenAI.ImageEditParamsNonStreaming['size']
    quality: OpenAI.ImageEditParamsNonStreaming['quality']
    output_format: OpenAI.ImageEditParamsNonStreaming['output_format']
  }

  const paths = data.imagePaths.split(',').map(p => p.trim()).filter(Boolean)

  if (paths.length === 0) {
    throw new Error('No image paths provided')
  }

  const imageBuffers = await Promise.all(paths.map(toPngBuffer))
  const images = await Promise.all(
    imageBuffers.map((buf, i) => bufferToPngFile(buf, paths[i]))
  )

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const request: OpenAI.ImageEditParamsNonStreaming = {
    model: 'gpt-image-2',
    image: images,
    prompt: data.prompt,
    size: data.size,
    quality: data.quality,
    output_format: data.output_format
  }

  if (data.maskPath) {
    const { width, height } = await sharp(imageBuffers[0]).metadata()

    if (!width || !height) {
      throw new Error('Cannot read image size to build the mask')
    }
    
    const invertedAlpha = await sharp(data.maskPath)
      .rotate()
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .extractChannel(3)
      .negate()
      .toBuffer()

    const maskBuf = await sharp({
      create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } }
    })
      .joinChannel(invertedAlpha)
      .png()
      .toBuffer()

    request.mask = await bufferToPngFile(maskBuf, data.maskPath)
  }

  const response = await openai.images.edit(request)

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
