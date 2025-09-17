#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import {ShadcnSvelteSearchDB} from "./ShadcnSvelteSearchDB.js";
import { logConfigPaths } from "./utils/config.js";
import { loadJsonlFromDirectory } from "./utils/jsonl.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load knowledge, examples, and components content
const knowledgeDir = join(__dirname, 'data', 'knowledge');
const examplesDir = join(__dirname, 'data', 'examples');
const componentsDir = join(__dirname, 'data', 'components');
const knowledgeContent = loadJsonlFromDirectory(knowledgeDir);
const examplesContent = loadJsonlFromDirectory(examplesDir);
const componentsContent = loadJsonlFromDirectory(componentsDir);

// Zod schemas for validation
const SearchQuerySchema = z.object({
  query: z.string().describe("Search query"),
  limit: z.number().optional().default(5).describe("Maximum number of results"),
});

const GenerateComponentSchema = z.object({
  description: z.string().describe("Description of the shadcn-svelte component to generate"),
  component_type: z.string().optional().describe("Specific component type (button, input, card, etc.)"),
  complexity: z.enum(["basic", "intermediate", "advanced"]).optional().default("intermediate"),
  theme: z.enum(["light", "dark", "auto"]).optional().default("auto"),
});

const AuditCodeSchema = z.object({
  code: z.string().describe("Svelte shadcn-ui code to audit"),
  focus: z.enum(["accessibility", "performance", "design-system", "best-practices", "all"]).optional().default("all"),
});

const ExplainConceptSchema = z.object({
  concept: z.string().describe("shadcn-svelte concept to explain"),
  detail_level: z.enum(["basic", "intermediate", "advanced"]).optional().default("intermediate"),
});

const SearchComponentSchema = z.object({
  component_name: z.string().describe("Name of the shadcn-svelte component to search"),
  include_variants: z.boolean().optional().default(true).describe("Include component variants in results"),
});

// Parse command line arguments
const args = process.argv.slice(2);
const forceResync = args.includes('--force');

class ShadcnSvelteMCPServer {
  private server: Server;
  private searchDB?: ShadcnSvelteSearchDB;

  constructor() {
    this.server = new Server(
      {
        name: "shadcn-svelte-mcp-server",
        version: "1.0.0",
        description: "MCP server for shadcn-svelte development with curated knowledge, components, and examples",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );
    this.setupHandlers();

    // Log configuration paths for debugging
    logConfigPaths();

    // Initialize database with config-based path
    this.searchDB = new ShadcnSvelteSearchDB();

    // Load data from modular JSONL folders
    const dataDir = join(__dirname, 'data');

    // Force resync if --force argument is provided
    if (forceResync) {
      console.log('🔄 Force resync enabled - reloading knowledge base...');
    }

    this.searchDB.populateFromFolders(dataDir, forceResync);
  }



  private setupHandlers() {

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: "shadcn-svelte://knowledge",
          mimeType: "application/json",
          name: "shadcn-svelte Knowledge Base",
          description: "Curated Q&A knowledge base for shadcn-svelte concepts, themes, and best practices",
        },
        {
          uri: "shadcn-svelte://examples",
          mimeType: "application/json",
          name: "shadcn-svelte Code Examples",
          description: "Searchable collection of shadcn-svelte component implementations and usage patterns",
        },
        {
          uri: "shadcn-svelte://components",
          mimeType: "application/json",
          name: "shadcn-svelte Components",
          description: "Complete catalog of shadcn-svelte UI components with props, variants, and installation",
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "shadcn-svelte://knowledge":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(knowledgeContent, null, 2),
              },
            ],
          };

        case "shadcn-svelte://examples":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(examplesContent, null, 2),
              },
            ],
          };

        case "shadcn-svelte://components":
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(componentsContent, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_knowledge",
          description: "Search the shadcn-svelte knowledge base for concepts, explanations, and Q&A",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query"
              },
              limit: {
                type: "number",
                default: 5,
                description: "Maximum number of results"
              }
            },
            required: ["query"]
          },
        },
        {
          name: "search_examples",
          description: "Search shadcn-svelte code examples and component patterns",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query"
              },
              limit: {
                type: "number",
                default: 5,
                description: "Maximum number of results"
              }
            },
            required: ["query"]
          },
        },
        {
          name: "search_components",
          description: "Search shadcn-svelte UI components with props, variants, and installation details",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Component search query"
              },
              limit: {
                type: "number",
                default: 5,
                description: "Maximum number of results"
              }
            },
            required: ["query"]
          },
        },
        {
          name: "generate_component",
          description: "Generate shadcn-svelte components with themes and variants",
          inputSchema: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description of the component to generate"
              },
              component_type: {
                type: "string",
                description: "Specific component type (button, input, card, etc.)"
              },
              complexity: {
                type: "string",
                enum: ["basic", "intermediate", "advanced"],
                default: "intermediate",
                description: "Complexity level"
              },
              theme: {
                type: "string",
                enum: ["light", "dark", "auto"],
                default: "auto",
                description: "Theme preference"
              }
            },
            required: ["description"]
          },
        },
        {
          name: "audit_with_rules",
          description: "Audit shadcn-svelte code for accessibility, design system compliance, and best practices",
          inputSchema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "Svelte shadcn-ui code to audit"
              },
              focus: {
                type: "string",
                enum: ["accessibility", "performance", "design-system", "best-practices", "all"],
                default: "all",
                description: "Focus area"
              }
            },
            required: ["code"]
          },
        },
        {
          name: "explain_concept",
          description: "Get detailed explanations of shadcn-svelte concepts with examples",
          inputSchema: {
            type: "object",
            properties: {
              concept: {
                type: "string",
                description: "shadcn-svelte concept to explain"
              },
              detail_level: {
                type: "string",
                enum: ["basic", "intermediate", "advanced"],
                default: "intermediate",
                description: "Detail level"
              }
            },
            required: ["concept"]
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "search_knowledge":
          return this.searchKnowledge(args);
        case "search_examples":
          return this.searchExamples(args);
        case "search_components":
          return this.searchComponents(args);
        case "generate_component":
          return this.generateComponent(args);
        case "audit_with_rules":
          return this.auditWithRules(args);
        case "explain_concept":
          return this.explainConcept(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: "generate-component",
          description: "Generate a shadcn-svelte component with themes and variants",
          arguments: [
            {
              name: "description",
              description: "Description of the component to create",
              required: true,
            },
            {
              name: "component_type",
              description: "Component type (button, input, card, dialog, etc.)",
              required: false,
            },
            {
              name: "theme",
              description: "Theme preference: light, dark, or auto",
              required: false,
            },
          ]
        },
        {
          name: "audit-shadcn-code",
          description: "Audit shadcn-svelte code for accessibility, design system compliance, and best practices",
          arguments: [
            {
              name: "code",
              description: "shadcn-svelte code to audit",
              required: true,
            },
            {
              name: "focus",
              description: "Focus area: accessibility, performance, design-system, best-practices, or all",
              required: false,
            },
          ]
        },
        {
          name: "explain-concept",
          description: "Explain shadcn-svelte concepts with detailed examples and usage patterns",
          arguments: [
            {
              name: "concept",
              description: "shadcn-svelte concept to explain (e.g., 'themes', 'components', 'installation')",
              required: true,
            },
            {
              name: "level",
              description: "Detail level: basic, intermediate, or advanced",
              required: false,
            },
          ]
        },
        {
          name: "find-component",
          description: "Find specific shadcn-svelte components with usage examples and variants",
          arguments: [
            {
              name: "component",
              description: "Component name or type to search for",
              required: true,
            },
            {
              name: "use_case",
              description: "Specific use case or requirements",
              required: false,
            },
          ]
        },
      ],
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "generate-component":
          return this.getGenerateComponentPrompt(args);
        case "audit-shadcn-code":
          return this.getAuditCodePrompt(args);
        case "explain-concept":
          return this.getExplainConceptPrompt(args);
        case "find-component":
          return this.getFindComponentPrompt(args);
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  private async searchKnowledge(args: any) {
    const { query, limit } = SearchQuerySchema.parse(args);
    const results = this.searchDB?.searchKnowledge(query, limit);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2),
      }],
    };
  }

  private async searchExamples(args: any) {
    const { query, limit } = SearchQuerySchema.parse(args);
    const results = this.searchDB?.searchExamples(query, limit);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2),
      }],
    };
  }

  private async searchComponents(args: any) {
    const { query, limit } = SearchQuerySchema.parse(args);
    const results = this.searchDB?.searchComponents(query, limit);

    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2),
      }],
    };
  }

  private async generateComponent(args: any) {
    const { description, component_type, complexity, theme } = GenerateComponentSchema.parse(args);

    // Search for relevant components and examples
    const componentResults = this.searchDB?.searchComponents(component_type || description, 3);
    const exampleResults = this.searchDB?.searchExamples(component_type || description, 3);
    const knowledgeResults = this.searchDB?.searchKnowledge(component_type || description, 2);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            request: { description, component_type, complexity, theme },
            relevant_components: componentResults?.results?.map(r => ({
              name: r.name,
              description: r.description,
              usage: r.usage,
              props: r.props,
              variants: r.variants,
              relevance: r.relevance_score,
            })),
            relevant_examples: exampleResults?.results?.map(r => ({
              title: r.title,
              component: r.component,
              code: r.code,
              complexity: r.complexity,
              relevance: r.relevance_score,
            })),
            relevant_knowledge: knowledgeResults?.results?.map(r => ({
              question: r.question,
              answer: r.answer,
              relevance: r.relevance_score,
            })),
            generation_guidance: {
              use_typescript: true,
              include_accessibility: true,
              follow_design_system: true,
              support_themes: true,
              use_tailwind_classes: true,
              implement_variants: true,
            },
          }, null, 2),
        },
      ],
    };
  }

  private async auditWithRules(args: any) {
    const { code, focus } = AuditCodeSchema.parse(args);

    // Find relevant best practices for shadcn-svelte
    const focusQueries = {
      accessibility: "accessibility aria screen reader keyboard navigation",
      performance: "performance optimization bundle size lazy loading",
      "design-system": "design system theming consistency tokens",
      "best-practices": "best practices component structure patterns",
      all: "best practices accessibility performance design system",
    };

    const relevantKnowledge = this.searchDB?.searchKnowledge(focusQueries[focus], 4);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            code_audit: {
              focus_area: focus,
              code_length: code.length,
              relevant_guidelines: relevantKnowledge?.results.map(r => ({
                guideline: r.question,
                explanation: r.answer,
                relevance: r.relevance_score,
              })),
              audit_checklist: {
                uses_typescript: code.includes(": ") || code.includes("interface ") || code.includes("type "),
                has_accessibility_attributes: code.includes("aria-") || code.includes("role=") || code.includes("tabindex"),
                uses_shadcn_components: code.includes("shadcn") || code.includes("ui/") || code.includes("@/components"),
                has_proper_theming: code.includes("theme") || code.includes("dark:") || code.includes("class:"),
                implements_variants: code.includes("variant") || code.includes("cva") || code.includes("cn("),
                follows_tailwind_patterns: code.includes("className") || code.includes("class=") || code.includes("tw-"),
                has_proper_imports: code.includes("import") && (code.includes("@/") || code.includes("$lib/")),
                uses_component_composition: code.includes("<slot") || code.includes("$$props") || code.includes("$$restProps"),
              },
            },
          }, null, 2),
        },
      ],
    };
  }

  private async explainConcept(args: any) {
    const { concept, detail_level } = ExplainConceptSchema.parse(args);
    
    const conceptResults = this.searchDB?.searchKnowledge(concept, 3);
    const exampleResults = this.searchDB?.searchExamples(concept, 2);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            concept_explanation: {
              concept,
              detail_level,
              explanations: conceptResults?.results?.map(item => ({
                question: item.question,
                answer: item.answer,
                relevance: item.relevance_score,
              })),
              code_examples: exampleResults?.results?.map(item => ({
                scenario: item.title,
                implementation: item.code,
                relevance: item.relevance_score,
              })),
            },
          }, null, 2),
        },
      ],
    };
  }

  private async getGenerateComponentPrompt(args: any) {
    const description = args?.description || "[component description]";
    const component_type = args?.component_type || "";
    const theme = args?.theme || "auto";

    return {
      description: "Generate a shadcn-svelte component with themes and variants",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a shadcn-svelte component: ${description}

${component_type ? `Component type: ${component_type}` : ""}
Theme preference: ${theme}

Requirements:
- Use TypeScript with proper type definitions
- Include accessibility attributes (ARIA, roles, keyboard navigation)
- Follow shadcn-svelte design system patterns
- Support light/dark theme variants
- Use Tailwind CSS classes with proper responsive design
- Implement component variants using class-variance-authority (cva)
- Include proper prop types and default values
- Use Svelte's reactive patterns ($$props, $$restProps, slots)
- Add JSDoc comments for component API documentation

Provide a complete, working component with:
1. Main component file (.svelte)
2. Component variants and styling
3. Usage examples
4. Installation instructions
5. Explanation of shadcn-svelte patterns used`,
          },
        },
      ],
    };
  }

  private async getAuditCodePrompt(args: any) {
    const code = args?.code || "[paste your shadcn-svelte code here]";
    const focus = args?.focus || "all";

    return {
      description: "Audit shadcn-svelte code for accessibility, design system compliance, and best practices",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please audit this shadcn-svelte code with focus on: ${focus}

\`\`\`svelte
${code}
\`\`\`

Audit checklist:
- ✅ Accessibility (ARIA attributes, keyboard navigation, screen reader support)
- ✅ TypeScript usage and type safety
- ✅ Component structure and organization
- ✅ Design system consistency (colors, spacing, typography)
- ✅ Theme support (light/dark mode compatibility)
- ✅ Tailwind CSS best practices and utility usage
- ✅ Component variants and styling patterns
- ✅ Svelte reactive patterns and prop handling
- ✅ Performance considerations (bundle size, rendering)
- ✅ Code organization and readability

Provide:
1. Issues found with severity (high/medium/low)
2. Specific code improvements with examples
3. Best practice recommendations for shadcn-svelte
4. Accessibility improvements and compliance gaps
5. Design system consistency recommendations
6. Performance optimization opportunities`,
          },
        },
      ],
    };
  }

  private async getExplainConceptPrompt(args: any) {
    const concept = args?.concept || "[shadcn-svelte concept]";
    const level = args?.level || "intermediate";

    return {
      description: "Explain shadcn-svelte concepts with detailed examples and usage patterns",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Explain the shadcn-svelte concept: "${concept}" at ${level} level

Please provide:
1. Clear definition and purpose
2. Syntax and usage examples
3. Integration with Svelte and SvelteKit patterns
4. When and why to use this feature
5. Design system implications and best practices
6. Theme and accessibility considerations
7. Component composition and variant patterns
8. Installation and setup requirements
9. Common gotchas or edge cases
10. Code examples showing practical implementation

Focus on practical understanding with working code examples that demonstrate the concept clearly in a shadcn-svelte context, including:
- Component structure and organization
- Styling with Tailwind CSS
- Theme switching and dark mode
- Accessibility implementation
- TypeScript integration`,
          },
        },
      ],
    };
  }

  private async getFindComponentPrompt(args: any) {
    const component = args?.component || "[component name]";
    const use_case = args?.use_case || "";

    return {
      description: "Find specific shadcn-svelte components with usage examples and variants",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Find shadcn-svelte component: "${component}"

${use_case ? `Use case: ${use_case}` : ""}

Please search the knowledge base and provide:
1. Component overview and description
2. Installation instructions via shadcn-svelte CLI
3. Available variants and styling options
4. Props and component API documentation
5. Usage examples with different configurations
6. Accessibility features and considerations
7. Theme support and dark mode compatibility
8. Integration patterns with other components
9. Common customization patterns
10. Best practices and gotchas

Focus on practical implementation with working code examples that show:
- Basic usage patterns
- Advanced customization
- Responsive design considerations
- Accessibility implementations
- Theme integration`,
          },
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new ShadcnSvelteMCPServer();
server.run().catch(console.error);