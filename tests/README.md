# MCP Tools Test Suite

Comprehensive test suite for shadcn-svelte MCP server using Bun's built-in test framework.

## 🧪 Test Coverage

The test suite covers all 6 MCP tools with real-world development scenarios:

### Knowledge Search (`search_knowledge`)
- Installation guides and setup
- Component customization and variants
- Accessibility best practices
- Troubleshooting common issues

### Examples Search (`search_examples`)
- Form implementation patterns
- Button variations and states
- Layout and dashboard designs
- Data display components

### Component Discovery (`search_components`)
- Form components (inputs, validation)
- Navigation components (tabs, menus)
- Overlay components (dialogs, sheets)
- Feedback components (alerts, notifications)

### Component Generation (`generate_component`)
- Custom button with loading states
- Complex form with validation
- Responsive data tables

### Code Auditing (`audit_with_rules`)
- Accessibility compliance
- Design system adherence
- Performance optimization

### Concept Explanation (`explain_concept`)
- Component variants system
- Theming and dark mode
- Responsive design patterns

## 🚀 Running Tests

### Run all tests
```bash
bun test
```

### Run tests in watch mode
```bash
bun run test:watch
```

### Run tests with coverage
```bash
bun run test:coverage
```

### Run specific test file
```bash
bun test tests/mcp-tools.test.ts
```

## 📊 Test Results

All tests are designed to be:
- **Realistic**: Based on actual developer workflows
- **Comprehensive**: Cover all major features and edge cases
- **Performance-aware**: Include response time validation
- **Error-resilient**: Test error handling scenarios

## 🏗️ Test Structure

```
tests/
├── mcp-tools.test.ts      # Main test suite with 20 tests
├── test-mcp-tools.ts      # Comprehensive manual testing
└── test-quick.ts          # Quick daily checks
```

## 🔧 Test Utilities

The test suite includes:
- `MCPTester` class for tool communication
- Automatic response validation
- Error handling verification
- Performance benchmarking
- Integration workflow testing

## 📈 Success Metrics

- **20 tests** covering all MCP tools
- **100% pass rate** required
- **Response time** under 5 seconds
- **Complete developer workflow** validation

## 🎯 Development Workflow

1. Make changes to MCP server
2. Run `bun test` to validate
3. Fix any failing tests
4. Commit with passing tests

The test suite ensures the MCP server remains reliable and useful for shadcn-svelte developers.