# shadcn-svelte MCP Server

A specialized Model Context Protocol (MCP) server for shadcn-svelte development, providing curated knowledge, code examples, and intelligent assistance for building modern UI components with design systems, theming, and accessibility best practices in Svelte and SvelteKit applications.

## Features

### 🔍 **Searchable Resources**
- **Knowledge Base**: Curated Q&A covering shadcn-svelte concepts, patterns, and best practices
- **Code Examples**: Searchable collection of shadcn-svelte implementation patterns

### 🛠️ **Intelligent Tools**
- `search_knowledge` - Find explanations and concepts
- `search_examples` - Discover code patterns and implementations
- `generate_with_context` - Create routers and procedures using curated patterns
- `audit_with_rules` - Review code against shadcn-svelte best practices
- `explain_concept` - Get detailed explanations with examples

### 📝 **Smart Prompts**
- `generate-router` - Generate modern shadcn-svelte routers
- `audit-trpc-code` - Audit code for optimization opportunities
- `explain-concept` - Detailed concept explanations
- `search-patterns` - Find specific implementation patterns

## Installation

### Option 1: Direct usage with bunx (Recommended)

Simply add to your Claude Desktop configuration - no installation required:

```json
{
  "mcpServers": {
    "shadcn-svelte": {
      "command": "bunx",
      "args": ["@binsarjr/shadcn-svelte-mcp"],
      "env": {}
    }
  }
}
```

### Option 2: Manual installation

```bash
# Clone and setup
git clone https://github.com/binsarjr/shadcn-svelte-mcp
cd shadcn-svelte-mcp

# Install dependencies with Bun
bun install

# Start the server
bun start
```

## Project Structure

```
shadcn-svelte-mcp/
├── src/
│   ├── index.ts                    # Main MCP server implementation
│   ├── ShadcnSvelteSearchDB.ts   # SQLite database with FTS5 search
│   └── data/
│       ├── knowledge/             # Curated Q&A knowledge base (JSONL)
│       ├── examples/              # Code examples and patterns (JSONL)
│       └── components/            # Component catalog with props and variants (JSONL)
├── package.json
├── tsconfig.json
└── README.md
```

## Usage with Claude Desktop

### Recommended: Using bunx (no installation required)

```json
{
  "mcpServers": {
    "shadcn-svelte": {
      "command": "bunx",
      "args": ["@binsarjr/shadcn-svelte-mcp"],
      "env": {}
    }
  }
}
```

### Alternative: Local installation

```json
{
  "mcpServers": {
    "trpc-sveltekit": {
      "command": "bun",
      "args": ["/path/to/shadcn-svelte-mcp/src/index.ts"],
      "env": {}
    }
  }
}
```

## Usage Examples

### 🔍 Search Knowledge
```
Tool: search_knowledge
Query: "button variants themes"
```

Returns detailed explanations about implementing button variants with different themes in shadcn-svelte.

### 📚 Find Code Examples
```
Tool: search_examples
Query: "card component accessibility"
```

Returns working shadcn-svelte card component implementations with accessibility features.

### 🧩 Search Components
```
Tool: search_components
Query: "dialog modal"
```

Returns component details for dialog/modal components with props, variants, and installation instructions.

### 🏗️ Generate Components
```
Tool: generate_component
Description: "User profile card with avatar, name, and action buttons"
Component Type: "card"
Theme: "auto"
```

Generates a complete shadcn-svelte component using modern patterns with relevant examples from the knowledge base.

### 🔍 Audit Code
```
Tool: audit_with_rules
Code: "const Button = ({ variant = 'default', ...props }) => { ... }"
Focus: "accessibility"
```

Analyzes code and suggests shadcn-svelte improvements for accessibility compliance and design system consistency.

## Key shadcn-svelte Concepts Covered

### 🎯 **Core shadcn-svelte Features**
- **Components** - Pre-built, accessible UI components
- **Themes** - Light/dark mode support with CSS variables
- **Variants** - Component styling variations using class-variance-authority
- **Design System** - Consistent color, spacing, and typography tokens
- **Accessibility** - WCAG-compliant components with proper ARIA attributes

### 🧩 **Svelte Integration**
- **Component Composition** - Using slots and component patterns
- **Reactive Patterns** - Svelte's reactivity with shadcn-svelte components
- **TypeScript Integration** - Proper type definitions and prop typing
- **SvelteKit Usage** - Server-side rendering and routing integration
- **Style Management** - Tailwind CSS integration and customization

### 📈 **Advanced Patterns**
- **Custom Theming** - Creating custom theme configurations
- **Component Variants** - Advanced styling patterns with cva
- **Responsive Design** - Mobile-first component implementations
- **Form Handling** - Form components with validation and accessibility
- **Animation** - Motion and transition patterns with shadcn-svelte

## Data Format

### Knowledge Base (JSONL files in `data/knowledge/`)
```json
{
  "question": "How do I customize shadcn-svelte button variants?",
  "answer": "To customize button variants in shadcn-svelte, you can modify the variants object in your button component using class-variance-authority (cva)...",
  "category": "components",
  "tags": ["button", "variants", "customization"]
}
```

### Examples (JSONL files in `data/examples/`)
```json
{
  "title": "Accessible Button with Custom Variants",
  "description": "Button component with custom variants and full accessibility support",
  "component": "Button",
  "code": "<script lang=\"ts\">\n  import { cn } from '$lib/utils';\n  import { buttonVariants } from './variants';\n  \n  type Variant = 'default' | 'destructive' | 'outline';\n  \n  interface Props {\n    variant?: Variant;\n    class?: string;\n  }\n  \n  let { variant = 'default', class: className, ...restProps }: Props = $props();\n</script>\n\n<button \n  class={cn(buttonVariants({ variant }), className)}\n  {...restProps}\n>\n  <slot />\n</button>",
  "category": "buttons",
  "tags": ["button", "variants", "accessibility", "typescript"],
  "complexity": "intermediate",
  "dependencies": ["class-variance-authority", "clsx"]
}
```

### Component Entries (JSONL files in `data/components/`)
```json
{
  "name": "Button",
  "description": "Displays a button or a component that looks like a button with various styling variants",
  "category": "form",
  "props": "{\"variant\": {\"type\": \"'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'\", \"default\": \"'default'\"}, \"size\": {\"type\": \"'default' | 'sm' | 'lg' | 'icon'\", \"default\": \"'default'\"}}",
  "usage": "<Button variant=\"outline\" size=\"sm\">Click me</Button>",
  "installation": "npx shadcn-svelte@latest add button",
  "variants": ["default", "destructive", "outline", "secondary", "ghost", "link"],
  "dependencies": ["class-variance-authority", "clsx"]
}
```

## Configuration

### Database Location

The server stores its SQLite database following the XDG Base Directory specification:

- **All platforms**: `~/.config/binsarjr/shadcn-svelte-mcp/database.db`

This provides a consistent, organized location across all operating systems.

### Environment Variables

You can customize the database location using environment variables:

```json
{
  "mcpServers": {
    "shadcn-svelte": {
      "command": "bunx",
      "args": ["@binsarjr/shadcn-svelte-mcp"],
      "env": {
        "SHADCN_SVELTE_MCP_CONFIG_DIR": "/custom/config/path",
        "SHADCN_SVELTE_MCP_DB_PATH": "/custom/database.db"
      }
    }
  }
}
```

### Search Features

The server uses SQLite with FTS5 for advanced search capabilities:

- **Full-Text Search**: Utilizes SQLite's FTS5 extension for powerful and efficient searching across the knowledge base, examples, and components.
- **Tokenization**: Employs the `unicode61` tokenizer with a comprehensive set of separators for robust indexing of terms.
- **Synonym Expansion**: Enhances search recall by automatically expanding query terms with predefined shadcn-svelte-specific synonyms.
- **Result Highlighting**: Search results include highlighted matches within relevant fields using FTS5's `highlight()` function.
- **Relevance Ranking**: Results are ordered by relevance based on FTS5's internal ranking algorithm.
- **Advanced Boosting**: Offers capabilities for custom scoring and boosting to fine-tune search results.

## Development

### Testing
The server provides comprehensive logging and error handling:

```bash
# Test the server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | bun start

# Test via bunx
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | bunx @binsarjr/shadcn-svelte-mcp

# Enable development mode with watch
bun run dev

# Inspect the server (for debugging)
bun run inspect
```

### Building and Publishing

```bash
# Build for production
bun run build

# Publish to npm
npm publish
```

## Contributing

### Adding Knowledge
1. Add entries to JSONL files in `src/data/knowledge/`
2. Format: `{"question": "...", "answer": "...", "category": "...", "tags": [...]}`
3. Focus on shadcn-svelte specific features and best practices

### Adding Examples
1. Add entries to JSONL files in `src/data/examples/`
2. Format: `{"title": "...", "description": "...", "component": "...", "code": "...", "category": "...", "tags": [...], "complexity": "...", "dependencies": [...]}`
3. Include complete, working shadcn-svelte code examples

### Adding Components
1. Add entries to JSONL files in `src/data/components/`
2. Format: `{"name": "...", "description": "...", "category": "...", "props": "...", "usage": "...", "installation": "...", "variants": [...], "dependencies": [...]}`
3. Document component API, variants, and usage patterns

### Search Optimization
- Use descriptive, searchable keywords in questions, titles, and descriptions
- Include alternative phrasings for common concepts
- Tag examples with relevant feature names (`button`, `theme`, `variant`, etc.)

## Advanced Usage

### Custom Search Queries
The search tools support sophisticated queries:

```typescript
// Search for component patterns
search_examples("button variants accessibility")

// Find theming guidance
search_knowledge("dark mode theme customization")

// Discover specific components
search_components("dialog modal overlay")
```

### Prompt Chaining
Use prompts in sequence for complex workflows:

1. `find-component` - Find relevant components
2. `generate-component` - Create based on patterns
3. `audit-shadcn-code` - Review and optimize

### Integration Tips
- **Claude Desktop**: Best for interactive development
- **API Integration**: Use programmatically for code generation
- **CI/CD**: Audit code in automated workflows
- **Documentation**: Generate examples for design system documentation

## Troubleshooting

### Common Issues

**"No results found"**
- Check search terms are relevant to shadcn-svelte
- Try broader queries first, then narrow down
- Ensure data files are properly formatted JSONL

**"Tool not found"**
- Check MCP client configuration
- Review server logs for startup errors

**"Invalid data format"**
- Validate JSONL files (one JSON object per line)
- Check for syntax errors in JSON objects

**Database/Config Issues**
- Check if config directory is writable
- Verify database permissions in the config folder
- Use `SHADCN_SVELTE_MCP_DB_PATH` environment variable for custom locations
- Check logs for database initialization messages

### Debugging
```bash
# Enable debug logging
DEBUG=* bun start

# Test database location
bunx @binsarjr/shadcn-svelte-mcp  # Watch for config path logs

# Check config directory (all platforms)
ls -la ~/.config/binsarjr/shadcn-svelte-mcp/
```

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Validation with [Zod](https://zod.dev/)
- Curated shadcn-svelte knowledge from official documentation and community best practices
- Powered by [shadcn-svelte](https://www.shadcn-svelte.com/), [Svelte](https://svelte.dev/), and [SvelteKit](https://kit.svelte.dev/)