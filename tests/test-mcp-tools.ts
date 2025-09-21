#!/usr/bin/env bun

/**
 * Comprehensive Test Suite for shadcn-svelte MCP Server
 *
 * This test suite validates all 6 MCP tools with real-world use cases
 * that developers would encounter when building shadcn-svelte applications.
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

interface TestResult {
  tool: string;
  testCase: string;
  description: string;
  success: boolean;
  response?: any;
  error?: string;
  duration: number;
}

interface MCPResponse {
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

class ShadcnSvelteMCPTester {
  private results: TestResult[] = [];
  private serverProcess: any;

  async startServer() {
    console.log('🚀 Starting shadcn-svelte MCP server...');

    return new Promise<void>((resolve, reject) => {
      this.serverProcess = spawn('bun', ['start'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Database already populated') || output.includes('✅ Database populated')) {
          console.log('✅ Server started successfully');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data: Buffer) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('error', (error: any) => {
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.serverProcess.killed) {
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  async callTool(toolName: string, params: any): Promise<MCPResponse> {
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

  async runTest(toolName: string, testCase: string, description: string, params: any): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`\n🧪 Testing: ${toolName} - ${testCase}`);
    console.log(`📝 Description: ${description}`);

    try {
      const response = await this.callTool(toolName, params);
      const duration = Date.now() - startTime;

      const success = response.result !== undefined && response.result.content !== undefined;

      const result: TestResult = {
        tool: toolName,
        testCase,
        description,
        success,
        response,
        duration
      };

      if (success) {
        console.log(`✅ PASSED (${duration}ms)`);

        // Show sample results for debugging
        if (response.result?.content?.[0]?.text) {
          const text = response.result.content[0].text;
          try {
            const parsed = JSON.parse(text);
            if (parsed.results && Array.isArray(parsed.results)) {
              console.log(`📊 Found ${parsed.results.length} results`);
              if (parsed.results.length > 0) {
                console.log(`🔍 First result: ${JSON.stringify(parsed.results[0]).substring(0, 150)}...`);
              }
            }
          } catch (e) {
            // If not JSON, just show first 150 chars
            console.log(`📄 Response: ${text.substring(0, 150)}...`);
          }
        }
      } else {
        console.log(`❌ FAILED (${duration}ms)`);
        console.log(`🚨 Error: ${JSON.stringify(response.error)}`);
      }

      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        tool: toolName,
        testCase,
        description,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };

      console.log(`❌ FAILED (${duration}ms)`);
      console.log(`🚨 Error: ${result.error}`);

      this.results.push(result);
      return result;
    }
  }

  async runAllTests() {
    console.log('🎯 Starting Comprehensive MCP Tools Test Suite');
    console.log('=============================================');

    // Test cases organized by tool and real-world use cases
    const testCases = [
      // search_knowledge - Real developer questions
      {
        tool: 'search_knowledge',
        tests: [
          {
            testCase: 'getting_started',
            description: 'Developer wants to know how to install shadcn-svelte',
            params: { query: 'install shadcn-svelte setup', limit: 3 }
          },
          {
            testCase: 'component_customization',
            description: 'Developer needs help with component variants and customization',
            params: { query: 'custom variants button theme', limit: 2 }
          },
          {
            testCase: 'troubleshooting',
            description: 'Developer is having issues with component styling',
            params: { query: 'styling issues css classes', limit: 2 }
          },
          {
            testCase: 'best_practices',
            description: 'Developer wants to know about accessibility best practices',
            params: { query: 'accessibility a11y screen reader', limit: 2 }
          }
        ]
      },

      // search_examples - Real implementation scenarios
      {
        tool: 'search_examples',
        tests: [
          {
            testCase: 'form_implementation',
            description: 'Developer needs to build a login form with validation',
            params: { query: 'login form validation input', limit: 3 }
          },
          {
            testCase: 'ui_patterns',
            description: 'Developer wants button examples with icons and different states',
            params: { query: 'button icons loading state', limit: 3 }
          },
          {
            testCase: 'layout_design',
            description: 'Developer is building a dashboard layout',
            params: { query: 'dashboard sidebar navigation', limit: 3 }
          },
          {
            testCase: 'data_display',
            description: 'Developer needs to display tabular data with sorting',
            params: { query: 'table data sorting filtering', limit: 2 }
          }
        ]
      },

      // search_components - Component discovery
      {
        tool: 'search_components',
        tests: [
          {
            testCase: 'form_components',
            description: 'Developer needs form input components',
            params: { query: 'input form field validation', limit: 3 }
          },
          {
            testCase: 'navigation',
            description: 'Developer needs navigation components',
            params: { query: 'tabs navigation menu', limit: 3 }
          },
          {
            testCase: 'overlay_elements',
            description: 'Developer needs dialog/modal components',
            params: { query: 'dialog modal popup overlay', limit: 3 }
          },
          {
            testCase: 'feedback_components',
            description: 'Developer needs to show alerts and notifications',
            params: { query: 'alert notification message', limit: 2 }
          }
        ]
      },

      // generate_component - Component generation assistance
      {
        tool: 'generate_component',
        tests: [
          {
            testCase: 'custom_button',
            description: 'Developer wants to create a custom button with loading states',
            params: {
              description: 'custom button component with loading spinner and success states',
              component_type: 'button',
              complexity: 'intermediate',
              theme: 'auto'
            }
          },
          {
            testCase: 'advanced_form',
            description: 'Developer needs a complex form with validation',
            params: {
              description: 'user profile form with validation and error handling',
              component_type: 'form',
              complexity: 'advanced',
              theme: 'light'
            }
          },
          {
            testCase: 'data_table',
            description: 'Developer needs a sortable data table',
            params: {
              description: 'responsive data table with sorting and filtering',
              component_type: 'table',
              complexity: 'advanced',
              theme: 'auto'
            }
          }
        ]
      },

      // audit_with_rules - Code quality and best practices
      {
        tool: 'audit_with_rules',
        tests: [
          {
            testCase: 'accessibility_audit',
            description: 'Audit component for accessibility issues',
            params: {
              code: `<script>
  import { Button } from '$lib/components/ui/button';
</script>

<Button onclick={submit}>Submit</Button>`,
              focus: 'accessibility'
            }
          },
          {
            testCase: 'design_system_audit',
            description: 'Audit for design system compliance',
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
          },
          {
            testCase: 'performance_audit',
            description: 'Audit for performance issues',
            params: {
              code: `<script>
  import { Button } from '$lib/components/ui/button';

  function handleClick() {
    // Heavy computation on every click
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    console.log(result);
  }
</script>

<Button on:click={handleClick}>Process Data</Button>`,
              focus: 'performance'
            }
          }
        ]
      },

      // explain_concept - Learning and understanding
      {
        tool: 'explain_concept',
        tests: [
          {
            testCase: 'concept_variants',
            description: 'Developer wants to understand component variants system',
            params: {
              concept: 'component variants cva class-variance-authority',
              detail_level: 'intermediate'
            }
          },
          {
            testCase: 'concept_accessibility',
            description: 'Developer needs to understand accessibility in shadcn-svelte',
            params: {
              concept: 'accessibility aria attributes screen reader support',
              detail_level: 'advanced'
            }
          },
          {
            testCase: 'concept_responsive',
            description: 'Developer wants to understand responsive design patterns',
            params: {
              concept: 'responsive design breakpoints mobile-first',
              detail_level: 'basic'
            }
          },
          {
            testCase: 'concept_theming',
            description: 'Developer needs help with theming system',
            params: {
              concept: 'theming dark mode css variables',
              detail_level: 'intermediate'
            }
          }
        ]
      }
    ];

    // Run all test cases
    for (const toolGroup of testCases) {
      console.log(`\n🛠️  Testing Tool: ${toolGroup.tool.toUpperCase()}`);
      console.log(''.repeat(50));

      for (const test of toolGroup.tests) {
        await this.runTest(toolGroup.tool, test.testCase, test.description, test.params);
      }
    }

    // Generate report
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 Test Report');
    console.log('=============');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`📈 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Pass Rate: ${passRate}%`);

    // Group by tool
    const toolResults = this.results.reduce((acc, result) => {
      if (!acc[result.tool]) {
        acc[result.tool] = { passed: 0, failed: 0, total: 0 };
      }
      acc[result.tool].total++;
      if (result.success) {
        acc[result.tool].passed++;
      } else {
        acc[result.tool].failed++;
      }
      return acc;
    }, {} as Record<string, { passed: number; failed: number; total: number }>);

    console.log('\n🛠️  Results by Tool:');
    console.log('==================');

    for (const [tool, results] of Object.entries(toolResults)) {
      const toolPassRate = ((results.passed / results.total) * 100).toFixed(1);
      console.log(`${tool.toUpperCase()}: ${results.passed}/${results.total} (${toolPassRate}%)`);
    }

    // Show failed tests
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      console.log('==============');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`${result.tool} - ${result.testCase}: ${result.error || 'Unknown error'}`);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: parseFloat(passRate)
      },
      toolResults,
      detailedResults: this.results
    };

    writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: test-report.json');

    // Overall result
    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The MCP server is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
  }
}

// Run the test suite
async function main() {
  const tester = new ShadcnSvelteMCPTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

main();