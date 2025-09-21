# Data Structure

This directory contains modular JSONL files organized by category for the shadcn-svelte MCP server.

## 📁 Folder Structure

### `knowledge/` - Knowledge Base Entries
- `basic.jsonl` - Basic shadcn-svelte concepts and getting started
- `components.jsonl` - Component usage patterns and examples
- `advanced.jsonl` - Advanced patterns and techniques

### `examples/` - Code Pattern Examples
- `buttons.jsonl` - Button component examples and patterns
- `forms.jsonl` - Form implementation examples
- `blocks.jsonl` - Block components and layout patterns
- `layout.jsonl` - Layout and responsive design examples

### `components/` - Component Catalog
- `ui-components.jsonl` - Complete UI component specifications
- `blocks.jsonl` - Block component specifications

## 🔄 How it Works

The MCP server automatically scans all `.jsonl` files in all directories and loads them into the search database. This modular approach allows for:

- Easy categorization of knowledge
- Better maintainability
- Simplified contributions
- Scalable knowledge base growth

## 📝 Adding New Content

1. Choose the appropriate category folder (`knowledge/`, `examples/`, or `components/`)
2. Add entries to existing `.jsonl` files or create new category files
3. Use `--force` flag to resync the database with new content

## 📊 Current Stats

- **Knowledge**: 23 entries across 3 categories
- **Examples**: 28 entries across 4 categories
- **Components**: 14 components with full specifications
- **Format**: JSONL (JSON Lines) for easy parsing and management

## 📋 Data Format Specifications

### Knowledge Entries
```json
{
  "question": "How do I install shadcn-svelte?",
  "answer": "To install shadcn-svelte, run the following command...",
  "category": "installation",
  "tags": ["setup", "cli", "configuration"]
}
```

### Example Entries
```json
{
  "title": "Basic Button Usage",
  "description": "Simple button implementation with different variants",
  "component": "Button",
  "code": "<script>import { Button } from '$lib/components/ui/button';</script>",
  "category": "buttons",
  "tags": ["button", "variants", "basic"],
  "complexity": "basic",
  "dependencies": ["@/components/ui/button"]
}
```

### Component Entries
```json
{
  "name": "Button",
  "description": "Displays a button or a component that looks like a button",
  "category": "form",
  "props": "{\"variant\": {\"type\": \"'default' | 'destructive' | 'outline'\", \"default\": \"'default'\"}}",
  "usage": "<Button variant=\"outline\">Click me</Button>",
  "installation": "npx shadcn-svelte@latest add button",
  "variants": ["default", "destructive", "outline"],
  "dependencies": ["class-variance-authority", "clsx", "tailwind-merge"]
}
```