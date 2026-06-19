# image-helper

## Disclaimer

I use a local Qwen, it doesn't know how to create pictures, so I decided to teach it. I've laid out the skill for myself, and I'll refine it, but if someone wants to use it – take it.

## About

OpenClaw skill for generating and editing images via the OpenAI `gpt-image-2` model.

## Requirements

- Node.js 18+

## How to use

Put image-helper in /workspace/skills. Example full path on a VPS/server: ~/.openclaw/workspace/skills/image-helper.

Add OPENAI_API_KEY in ~/.openclaw/openclaw.json.

```json
{
  "skills": {
    "entries": {
      "image-helper": {
        "enabled": true,
        "env": {
          "OPENAI_API_KEY": "key"
        }
      }
    }
  }
}
```

Tell the agent that a new skill has appeared, let him finish the setup on his own.

## What it does

| Task | How to trigger |
|------|----------------|
| Generate an image from a text description | "Generate / draw / create an image of …" |
| Edit an existing image | "Change / fix / update this image: …" |
| Edit with a mask | Provide a mask PNG — paint the area to edit; leave the rest transparent |

Generated files are saved to `storage/` inside the skill directory.

## U.P.D:

In SKILL.md you can change path ~/.openclaw on your own path, if you run into problems.