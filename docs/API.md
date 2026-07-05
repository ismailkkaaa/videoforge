# VideoForge API & MCP Reference

This document describes the REST API endpoints and Model Context Protocol (MCP) tools exposed by **VideoForge**.

## REST API Reference

The local Express server binds to `127.0.0.1:3000` by default.

### 1. `POST /render`
Triggers the rendering of a video from a full JSON configuration payload.

**Request:**
- **Headers**: `Content-Type: application/json`
- **Body**: Conforms to the `VideoForgeConfigSchema` (resolution, fps, theme, and scenes).

```json
{
  "meta": {
    "title": "API Demo",
    "fps": 30
  },
  "theme": {
    "primaryColor": "#1a1a2e",
    "secondaryColor": "#e94560",
    "fontFamily": "sans-serif"
  },
  "scenes": [
    {
      "id": "scene-1",
      "template": "title-card",
      "duration": 3,
      "data": {
        "title": "REST API Render",
        "subtitle": "Triggered asynchronously"
      }
    }
  ]
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-lqi4817a-241c",
  "status": "pending"
}
```

### 2. `GET /jobs/:id`
Retrieves the status and output of a background rendering job.

**Response (200 OK):**
```json
{
  "id": "job-lqi4817a-241c",
  "status": "completed",
  "outputPath": "/absolute/path/to/video.mp4"
}
```

### 3. `POST /analyze`
Analyzes content (markdown, github, or url) and returns the generated scenes.

**Request:**
```json
{
  "type": "markdown",
  "source": "# VideoForge\nAn open-source generator"
}
```

**Response (200 OK):**
```json
{
  "scenes": [
    {
      "id": "scene-1",
      "template": "title-card",
      "duration": 3,
      "data": {
        "title": "VideoForge",
        "subtitle": "An open-source generator"
      }
    }
  ]
}
```

### 4. `POST /generate`
Runs analysis, automatically formulates a configuration, and triggers rendering.

**Request:**
```json
{
  "type": "url",
  "source": "https://example.com/product",
  "meta": { "outputPath": "./output/my-custom-output.mp4" }
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job-lqi4817b-f92a",
  "status": "pending"
}
```

---

## MCP Server Tools Reference

Exposed via the standard Model Context Protocol on stdio transport.

### 1. `init_project`
Initializes a new VideoForge project directory with a default config, schema, and sample logo.

**Arguments:**
- `targetDir` (string, optional): Directory path to initialize. Defaults to `./`.

### 2. `analyze_content`
Analyzes content and returns a storyboard JSON scenes array.

**Arguments:**
- `type` (string, required): `markdown` | `github` | `url`.
- `source` (string, required): The raw markdown string, repo path/URL, or website URL.

### 3. `render_video`
Renders a video from a config file path or a direct JSON configuration object.

**Arguments:**
- `configPath` (string, optional): Path to JSON/YAML configuration file.
- `config` (object, optional): Direct VideoForge configuration object conforming to schema.
