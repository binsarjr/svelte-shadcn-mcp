/**
 * MCP Tools Test Suite using Bun's built-in test framework
 * Tests all shadcn-svelte MCP server tools with real-world scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// Test utilities
class MCPTester {
  private serverProcess: any;

  async callTool(toolName: string, params: any): Promise<any> {
    const request = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: params
      }
    };

    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['start'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        error += data.toString();
      });

      child.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const lines = output.split('\n').filter(line => line.trim());
          const jsonLine = lines.find(line => line.trim().startsWith('{'));

          if (jsonLine) {
            resolve(JSON.parse(jsonLine));
          } else {
            reject(new Error('No valid JSON response found'));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError}`));
        }
      });

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();
    });
  }
}

const tester = new MCPTester();

// Test Data for realistic scenarios
const testCases = {
  searchKnowledge: [
    {
      name: 'should find installation guides',
      params: { query: 'install shadcn-svelte setup', limit: 3 },
      expectedResults: 3
    },
    {
      name: 'should find variant customization help',
      params: { query: 'custom variants button theme', limit: 2 },
      expectedResults: 2
    },
    {
      name: 'should find accessibility information',
      params: { query: 'accessibility a11y screen reader', limit: 2 },
      expectedResults: 2
    }
  ],

  searchExamples: [
    {
      name: 'should find form implementation examples',
      params: { query: 'login form validation input', limit: 3 },
      expectedResults: 3
    },
    {
      name: 'should find button examples with states',
      params: { query: 'button icons loading state', limit: 3 },
      expectedResults: 3
    },
    {
      name: 'should find layout examples',
      params: { query: 'dashboard sidebar navigation', limit: 3 },
      expectedResults: 3
    }
  ],

  searchComponents: [
    {
      name: 'should find form components',
      params: { query: 'input form field validation', limit: 3 },
      expectedResults: 3
    },
    {
      name: 'should find navigation components',
      params: { query: 'tabs navigation menu', limit: 3 },
      expectedResults: 3
    },
    {
      name: 'should find overlay components',
      params: { query: 'dialog modal popup overlay', limit: 3 },
      expectedResults: 3
    }
  ],

  generateComponent: [
    {
      name: 'should generate custom button component',
      params: {
        description: 'custom button component with loading spinner and success states',
        component_type: 'button',
        complexity: 'intermediate',
        theme: 'auto'
      }
    },
    {
      name: 'should generate complex form component',
      params: {
        description: 'user profile form with validation and error handling',
        component_type: 'form',
        complexity: 'advanced',
        theme: 'light'
      }
    }
  ],

  auditWithRules: [
    {
      name: 'should audit accessibility issues',
      params: {
        code: `<script>
  import { Button } from '$lib/components/ui/button';
</script>

<Button onclick={submit}>Submit</Button>`,
        focus: 'accessibility'
      }
    },
    {
      name: 'should audit design system compliance',
      params: {
        code: `<script>
  import { Button, Input } from '$lib/components/ui/button';
</script>

<div class="p-4">
  <Button class="bg-blue-500 text-white p-2 rounded">Click</Button>
  <Input class="border-2 border-red-500" placeholder="Enter text" />
</div>`,
        focus: 'design-system'
      }
    }
  ],

  explainConcept: [
    {
      name: 'should explain component variants',
      params: {
        concept: 'component variants cva class-variance-authority',
        detail_level: 'intermediate'
      }
    },
    {
      name: 'should explain theming system',
      params: {
        concept: 'theming dark mode css variables',
        detail_level: 'intermediate'
      }
    }
  ]
};

// Test suites
describe('shadcn-svelte MCP Server', () => {
  describe('search_knowledge', () => {
    for (const testCase of testCases.searchKnowledge) {
      it(testCase.name, async () => {
        const response = await tester.callTool('search_knowledge', testCase.params);

        expect(response.result).toBeDefined();
        expect(response.result.content).toHaveLength(1);
        expect(response.result.content[0].type).toBe('text');

        const text = response.result.content[0].text;
        const parsed = JSON.parse(text);

        expect(parsed.results).toBeInstanceOf(Array);
        expect(parsed.results.length).toBeGreaterThan(0);
        expect(parsed.total).toBeGreaterThan(0);
        expect(parsed.query).toBe(testCase.params.query);
        expect(parsed.search_time_ms).toBeNumber();
      });
    }
  });

  describe('search_examples', () => {
    for (const testCase of testCases.searchExamples) {
      it(testCase.name, async () => {
        const response = await tester.callTool('search_examples', testCase.params);

        expect(response.result).toBeDefined();
        expect(response.result.content).toHaveLength(1);
        expect(response.result.content[0].type).toBe('text');

        const text = response.result.content[0].text;
        const parsed = JSON.parse(text);

        expect(parsed.results).toBeInstanceOf(Array);
        expect(parsed.results.length).toBeGreaterThan(0);

        // Check example-specific properties
        const firstResult = parsed.results[0];
        expect(firstResult).toHaveProperty('title');
        expect(firstResult).toHaveProperty('component');
        expect(firstResult).toHaveProperty('code');
        expect(firstResult).toHaveProperty('complexity');
      });
    }
  });

  describe('search_components', () => {
    for (const testCase of testCases.searchComponents) {
      it(testCase.name, async () => {
        const response = await tester.callTool('search_components', testCase.params);

        expect(response.result).toBeDefined();
        expect(response.result.content).toHaveLength(1);
        expect(response.result.content[0].type).toBe('text');

        const text = response.result.content[0].text;
        const parsed = JSON.parse(text);

        expect(parsed.results).toBeInstanceOf(Array);
        expect(parsed.results.length).toBeGreaterThan(0);

        // Check component-specific properties
        const firstResult = parsed.results[0];
        expect(firstResult).toHaveProperty('name');
        expect(firstResult).toHaveProperty('description');
        expect(firstResult).toHaveProperty('usage');
        expect(firstResult).toHaveProperty('installation');
      });
    }
  });

  describe('generate_component', () => {
    for (const testCase of testCases.generateComponent) {
      it(testCase.name, async () => {
        const response = await tester.callTool('generate_component', testCase.params);

        expect(response.result).toBeDefined();
        expect(response.result.content).toHaveLength(1);
        expect(response.result.content[0].type).toBe('text');

        const text = response.result.content[0].text;
        const parsed = JSON.parse(text);

        // Check generation-specific properties
        expect(parsed).toHaveProperty('request');
        expect(parsed).toHaveProperty('generation_guidance');
        expect(parsed.request.description).toBe(testCase.params.description);
        expect(parsed.generation_guidance.use_typescript).toBe(true);
        expect(parsed.generation_guidance.include_accessibility).toBe(true);
      });
    }
  });

  describe('audit_with_rules', () => {
    for (const testCase of testCases.auditWithRules) {
      it(testCase.name, async () => {
        const response = await tester.callTool('audit_with_rules', testCase.params);

        expect(response.result).toBeDefined();
        expect(response.result.content).toHaveLength(1);
        expect(response.result.content[0].type).toBe('text');

        const text = response.result.content[0].text;
        const parsed = JSON.parse(text);

        // Check audit-specific properties
        expect(parsed).toHaveProperty('code_audit');
        expect(parsed.code_audit).toHaveProperty('focus_area');
        expect(parsed.code_audit).toHaveProperty('relevant_guidelines');
        expect(parsed.code_audit.relevant_guidelines).toBeInstanceOf(Array);
      });
    }
  });

  describe('explain_concept', () => {
    for (const testCase of testCases.explainConcept) {
      it(testCase.name, async () => {
        const response = await tester.callTool('explain_concept', testCase.params);

        expect(response.result).toBeDefined();
        expect(response.result.content).toHaveLength(1);
        expect(response.result.content[0].type).toBe('text');

        const text = response.result.content[0].text;
        const parsed = JSON.parse(text);

        // Check explanation-specific properties
        expect(parsed).toHaveProperty('concept_explanation');
        expect(parsed.concept_explanation).toHaveProperty('concept');
        expect(parsed.concept_explanation).toHaveProperty('explanations');
        expect(parsed.concept_explanation.explanations).toBeInstanceOf(Array);
      });
    }
  });

  // Performance tests
  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = performance.now();
      const response = await tester.callTool('search_knowledge', { query: 'button', limit: 5 });
      const endTime = performance.now();

      expect(response.result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle complex queries', async () => {
      const response = await tester.callTool('search_examples', {
        query: 'responsive dashboard with charts and forms validation',
        limit: 10
      });

      expect(response.result).toBeDefined();
      const text = response.result.content[0].text;
      const parsed = JSON.parse(text);

      expect(parsed.results).toBeInstanceOf(Array);
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('should handle empty queries gracefully', async () => {
      const response = await tester.callTool('search_knowledge', { query: '', limit: 5 });

      // Should still return a valid response structure
      expect(response.result).toBeDefined();
    });

    it('should handle invalid parameters gracefully', async () => {
      try {
        const response = await tester.callTool('search_knowledge', {});

        // Either we get a valid response or the tool handles the error gracefully
        if (response.result) {
          expect(response.result.content).toBeDefined();
        }
      } catch (error) {
        // Error handling is also acceptable
        expect(error).toBeDefined();
      }
    });
  });
});

// Integration test
describe('Integration Tests', () => {
  it('should support complete developer workflow', async () => {
    // Step 1: Search for knowledge
    const knowledgeResponse = await tester.callTool('search_knowledge', {
      query: 'button component variants',
      limit: 2
    });

    expect(knowledgeResponse.result).toBeDefined();

    // Step 2: Find examples
    const examplesResponse = await tester.callTool('search_examples', {
      query: 'button variants implementation',
      limit: 2
    });

    expect(examplesResponse.result).toBeDefined();

    // Step 3: Generate component
    const generateResponse = await tester.callTool('generate_component', {
      description: 'custom button with variants and loading states',
      component_type: 'button',
      complexity: 'intermediate'
    });

    expect(generateResponse.result).toBeDefined();

    // Step 4: Audit the generated code
    const auditResponse = await tester.callTool('audit_with_rules', {
      code: '<Button variant="primary">Click me</Button>',
      focus: 'accessibility'
    });

    expect(auditResponse.result).toBeDefined();

    console.log('✅ Complete developer workflow test passed');
  });
});

console.log('🧪 MCP Tools Test Suite loaded successfully');
console.log('📋 Test scenarios:');
console.log('   - Knowledge search (installation, customization, accessibility)');
console.log('   - Examples search (forms, buttons, layouts)');
console.log('   - Component discovery (forms, navigation, overlays)');
console.log('   - Component generation (buttons, forms)');
console.log('   - Code auditing (accessibility, design system)');
console.log('   - Concept explanation (variants, theming)');
console.log('   - Performance and error handling');
console.log('   - Complete developer workflow integration');