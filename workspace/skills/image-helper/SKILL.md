---
name: image-helper
description: Use it when you are asked to generate/edit images based on user prompts or other input data.
---

# Image Generation

Use this skill when you need generate/edit images based on user prompts or other input data. You can specify the style, content, and other parameters to customize the generated images.

## Steps

1. Determine if there is enough data from the user to create an image. If necessary, ask clarifying questions.
2. When you have enough data, create a promt in English for next step – generate/edit an image.

### If the user wants to generate an image:
3. For generating an image, use the `generateImage.useCase.js` function with the created prompt. Function located in "~/.openclaw/workspace/skills/image-helper/generateImage.useCase.js". Look documentation in API part.

### If the user wants to edit an image:
4. For editing an image, use the `editImage.useCase.js` function with the original image(s) and edit instructions. Function located in "~/.openclaw/workspace/skills/image-helper/editImage.useCase.js". You can pass several input images (for example, a photo of the user plus a reference outfit) and an optional mask. Look documentation in API part.

### Next
5. Take the `path` from the JSON printed to stdout and return that image file to the user.
6. Periodically clean the storage folder, first delete the old photos. Start cleaning when there are a lot of photos, more than 30.

## API

**Prerequisites:** the environment must have `OPENAI_API_KEY` set. Both scripts use
the OpenAI `gpt-image-2` model.

The `.js` files are **self-contained bundles** — the OpenAI SDK and other
dependencies are already included. However, `editImage.useCase.js` requires
`sharp` (native image conversion library) to be installed locally.

Before running `editImage.useCase.js`, check whether `node_modules` already
exists in this directory. If it does — skip installation entirely. If it does
not exist — run `npm install` once in the skill directory
(`~/.openclaw/workspace/skills/image-helper/`) and never repeat it.

**Output contract (both scripts):**
- Success → a JSON object is printed to **stdout** and the process exits with code `0`.
- Failure → an error message is printed to **stderr** and the process exits with a
  non-zero code. Use the exit code to decide success/failure.

### `generateImage.useCase.js`

**Usage:**
```
node generateImage.useCase.js <prompt> [size] [quality] [output_format]
```

**Arguments:**

| # | Name | Required | Values | Default |
|---|------|----------|--------|---------|
| 1 | `prompt` | yes | Any text description of the image | — |
| 2 | `size` | no | `1024x1024`, `1536x1024`, `1024x1536`, `auto` | `auto` |
| 3 | `quality` | no | `auto`, `low`, `medium`, `high` | `auto` |
| 4 | `output_format` | no | `png`, `jpeg`, `webp` | `png` |

**Returns (stdout, JSON):**
```json
{
  "filename": "image_3f1a2b....png",
  "path": "~/.openclaw/workspace/skills/image-helper/storage/image_3f1a2b....png"
}
```

**Example:**
```
node generateImage.useCase.js "A futuristic city at sunset" auto high png
```

**Note:** If the prompt contains quotes, use shell quoting rules:
- Single quotes inside the prompt → wrap the whole prompt in double quotes: `"it's a cat"`
- Double quotes inside the prompt → escape with backslash: `"He said \"hello\""` or wrap in single quotes: `'He said "hello"'`

### `editImage.useCase.js`

Edits one or more existing images according to a prompt. Supports multiple input
images (e.g. a photo of the user plus a reference outfit) and an optional mask.

**Usage:**
```
node editImage.useCase.js <imagePaths> <prompt> [maskPath] [size] [quality] [output_format]
```

**Arguments:**

| # | Name | Required | Values | Default |
|---|------|----------|--------|---------|
| 1 | `imagePaths` | yes | One or more absolute file paths, comma-separated (`/path/a.png,/path/b.png`) | — |
| 2 | `prompt` | yes | Text describing the edit to apply | — |
| 3 | `maskPath` | no | Absolute path to a mask PNG. **Paint (fill with any opaque color) the areas you want to edit; leave the rest transparent or empty.** The script automatically inverts the alpha channel to match what the OpenAI API expects. Pass `""` to skip | `""` |
| 4 | `size` | no | `1024x1024`, `1536x1024`, `1024x1536`, `auto` | `auto` |
| 5 | `quality` | no | `auto`, `low`, `medium`, `high` | `auto` |
| 6 | `output_format` | no | `png`, `jpeg`, `webp` | `png` |

Supported input image formats: `.png`, `.jpg`/`.jpeg`, `.webp`.

**Returns (stdout, JSON):**
```json
{
  "filename": "image_3f1a2b....png",
  "path": "~/.openclaw/workspace/skills/image-helper/storage/image_3f1a2b....png"
}
```

**Examples:**

Add something to a single photo:
```
node editImage.useCase.js "/path/to/me.png" "Add sunglasses to the person"
```

Combine two photos (dress the user in a reference outfit):
```
node editImage.useCase.js "/path/to/me.png,/path/to/suit.png" "Dress the person in the suit"
```

With a mask (only the masked area is edited):
```
node editImage.useCase.js "/path/to/me.png" "Replace the background with a beach" "/path/to/mask.png"
```

> **Mask convention:** paint (fill with any opaque color) the region you want to
> change; leave the rest transparent. The script inverts alpha internally so
> that the API edits exactly the painted zone. If the user provides a mask
> without a transparent background, ask them to repaint it following this rule
> rather than troubleshooting the script.

**Note:** The same shell quoting rules as above apply to the prompt.