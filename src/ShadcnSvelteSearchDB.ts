import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

export interface KnowledgeEntry {
  id?: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  relevance_score?: number;
  highlighted_answer?: string;
}

export interface ExampleEntry {
  id?: number;
  title: string;
  description: string;
  component: string;
  code: string;
  category: string;
  tags: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  dependencies: string[];
  relevance_score?: number;
  highlighted_code?: string;
}

export interface ComponentEntry {
  id?: number;
  name: string;
  description: string;
  category: string;
  props: string;
  usage: string;
  installation: string;
  variants: string[];
  dependencies: string[];
  relevance_score?: number;
  highlighted_usage?: string;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  query: string;
  search_time_ms: number;
}

export class ShadcnSvelteSearchDB {
  private db: Database;
  private dbPath: string;

  constructor() {
    // Use XDG config directory
    const configDir = join(homedir(), '.config', 'binsarjr', 'shadcn-svelte-mcp');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    this.dbPath = join(configDir, 'database.db');
    this.db = new Database(this.dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    // Enable foreign keys and WAL mode for better performance
    this.db.exec("PRAGMA foreign_keys = ON");
    this.db.exec("PRAGMA journal_mode = WAL");

    // Create main tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT NOT NULL -- JSON array as text
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        component TEXT NOT NULL,
        code TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT NOT NULL, -- JSON array as text
        complexity TEXT NOT NULL CHECK(complexity IN ('basic', 'intermediate', 'advanced')),
        dependencies TEXT NOT NULL -- JSON array as text
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        props TEXT NOT NULL, -- JSON object as text
        usage TEXT NOT NULL,
        installation TEXT NOT NULL,
        variants TEXT NOT NULL, -- JSON array as text
        dependencies TEXT NOT NULL -- JSON array as text
      )
    `);

    // Create FTS5 virtual tables for full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
        question, answer, category, tags,
        content='knowledge',
        content_rowid='id',
        tokenize='porter'
      )
    `);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS examples_fts USING fts5(
        title, description, component, code, category, tags, complexity, dependencies,
        content='examples',
        content_rowid='id',
        tokenize='porter'
      )
    `);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS components_fts USING fts5(
        name, description, category, props, usage, installation, variants, dependencies,
        content='components',
        content_rowid='id',
        tokenize='porter'
      )
    `);

    // Create triggers to maintain FTS sync
    this.createFTSTriggers();

    // Create synonyms for better search results
    this.createSynonyms();
  }

  private createFTSTriggers() {
    // Knowledge FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS knowledge_fts_insert AFTER INSERT ON knowledge BEGIN
        INSERT INTO knowledge_fts(rowid, question, answer, category, tags)
        VALUES (new.id, new.question, new.answer, new.category, new.tags);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS knowledge_fts_delete AFTER DELETE ON knowledge BEGIN
        INSERT INTO knowledge_fts(knowledge_fts, rowid, question, answer, category, tags)
        VALUES ('delete', old.id, old.question, old.answer, old.category, old.tags);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS knowledge_fts_update AFTER UPDATE ON knowledge BEGIN
        INSERT INTO knowledge_fts(knowledge_fts, rowid, question, answer, category, tags)
        VALUES ('delete', old.id, old.question, old.answer, old.category, old.tags);
        INSERT INTO knowledge_fts(rowid, question, answer, category, tags)
        VALUES (new.id, new.question, new.answer, new.category, new.tags);
      END
    `);

    // Examples FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS examples_fts_insert AFTER INSERT ON examples BEGIN
        INSERT INTO examples_fts(rowid, title, description, component, code, category, tags, complexity, dependencies)
        VALUES (new.id, new.title, new.description, new.component, new.code, new.category, new.tags, new.complexity, new.dependencies);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS examples_fts_delete AFTER DELETE ON examples BEGIN
        INSERT INTO examples_fts(examples_fts, rowid, title, description, component, code, category, tags, complexity, dependencies)
        VALUES ('delete', old.id, old.title, old.description, old.component, old.code, old.category, old.tags, old.complexity, old.dependencies);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS examples_fts_update AFTER UPDATE ON examples BEGIN
        INSERT INTO examples_fts(examples_fts, rowid, title, description, component, code, category, tags, complexity, dependencies)
        VALUES ('delete', old.id, old.title, old.description, old.component, old.code, old.category, old.tags, old.complexity, old.dependencies);
        INSERT INTO examples_fts(rowid, title, description, component, code, category, tags, complexity, dependencies)
        VALUES (new.id, new.title, new.description, new.component, new.code, new.category, new.tags, new.complexity, new.dependencies);
      END
    `);

    // Components FTS triggers
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS components_fts_insert AFTER INSERT ON components BEGIN
        INSERT INTO components_fts(rowid, name, description, category, props, usage, installation, variants, dependencies)
        VALUES (new.id, new.name, new.description, new.category, new.props, new.usage, new.installation, new.variants, new.dependencies);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS components_fts_delete AFTER DELETE ON components BEGIN
        INSERT INTO components_fts(components_fts, rowid, name, description, category, props, usage, installation, variants, dependencies)
        VALUES ('delete', old.id, old.name, old.description, old.category, old.props, old.usage, old.installation, old.variants, old.dependencies);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS components_fts_update AFTER UPDATE ON components BEGIN
        INSERT INTO components_fts(components_fts, rowid, name, description, category, props, usage, installation, variants, dependencies)
        VALUES ('delete', old.id, old.name, old.description, old.category, old.props, old.usage, old.installation, old.variants, old.dependencies);
        INSERT INTO components_fts(rowid, name, description, category, props, usage, installation, variants, dependencies)
        VALUES (new.id, new.name, new.description, new.category, new.props, new.usage, new.installation, new.variants, new.dependencies);
      END
    `);
  }

  private createSynonyms() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS synonyms (
        term TEXT PRIMARY KEY,
        synonyms TEXT NOT NULL -- JSON array of synonyms
      )
    `);

    // Insert shadcn-svelte specific synonyms
    const synonymData = [
      { term: 'button', synonyms: JSON.stringify(['btn', 'click', 'action', 'submit', 'trigger']) },
      { term: 'input', synonyms: JSON.stringify(['field', 'form', 'text', 'entry', 'textbox']) },
      { term: 'modal', synonyms: JSON.stringify(['dialog', 'popup', 'overlay', 'window']) },
      { term: 'dropdown', synonyms: JSON.stringify(['select', 'menu', 'picker', 'combobox']) },
      { term: 'card', synonyms: JSON.stringify(['container', 'box', 'panel', 'section']) },
      { term: 'theme', synonyms: JSON.stringify(['dark', 'light', 'style', 'appearance', 'mode']) },
      { term: 'component', synonyms: JSON.stringify(['ui', 'element', 'widget', 'control']) },
      { term: 'tailwind', synonyms: JSON.stringify(['css', 'style', 'class', 'utility']) },
      { term: 'accessibility', synonyms: JSON.stringify(['a11y', 'screen-reader', 'aria', 'inclusive']) },
      { term: 'animation', synonyms: JSON.stringify(['transition', 'motion', 'effect', 'smooth']) },
      { term: 'responsive', synonyms: JSON.stringify(['mobile', 'tablet', 'desktop', 'breakpoint']) },
      { term: 'form', synonyms: JSON.stringify(['validation', 'submit', 'input', 'field']) },
      { term: 'chart', synonyms: JSON.stringify(['graph', 'visualization', 'data', 'plot']) },
      { term: 'table', synonyms: JSON.stringify(['grid', 'data', 'row', 'column', 'datatable']) },
      { term: 'navigation', synonyms: JSON.stringify(['nav', 'menu', 'breadcrumb', 'sidebar']) },
    ];

    const insertSynonym = this.db.prepare('INSERT OR REPLACE INTO synonyms (term, synonyms) VALUES (?, ?)');

    for (const { term, synonyms } of synonymData) {
      insertSynonym.run(term, synonyms);
    }
  }

  private expandQuery(query: string): string {
    const words = query.toLowerCase().split(/\s+/);
    const expandedWords: string[] = [];

    const getSynonyms = this.db.prepare('SELECT synonyms FROM synonyms WHERE term = ?');

    for (const word of words) {
      expandedWords.push(word);

      const result = getSynonyms.get(word) as { synonyms: string } | undefined;
      if (result) {
        const synonyms = JSON.parse(result.synonyms) as string[];
        expandedWords.push(...synonyms);
      }
    }

    return expandedWords.join(' ');
  }

  searchKnowledge(query: string, limit: number = 5): SearchResult<KnowledgeEntry> {
    const startTime = performance.now();
    const expandedQuery = this.expandQuery(query);

    const stmt = this.db.prepare(`
      SELECT k.*,
             snippet(knowledge_fts, 1, '<mark>', '</mark>', '...', 32) as highlighted_answer,
             bm25(knowledge_fts, 1.0, 0.5, 0.3, 0.2) as relevance_score
      FROM knowledge k
      JOIN knowledge_fts ON k.id = knowledge_fts.rowid
      WHERE knowledge_fts MATCH ?
      ORDER BY relevance_score DESC
      LIMIT ?
    `);

    const results = stmt.all(expandedQuery, limit) as (KnowledgeEntry & { highlighted_answer: string })[];
    const endTime = performance.now();

    return {
      results,
      total: results.length,
      query,
      search_time_ms: Math.round(endTime - startTime),
    };
  }

  searchExamples(query: string, limit: number = 5): SearchResult<ExampleEntry> {
    const startTime = performance.now();
    const expandedQuery = this.expandQuery(query);

    const stmt = this.db.prepare(`
      SELECT e.*,
             snippet(examples_fts, 3, '<mark>', '</mark>', '...', 64) as highlighted_code,
             bm25(examples_fts, 1.0, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1, 0.1) as relevance_score
      FROM examples e
      JOIN examples_fts ON e.id = examples_fts.rowid
      WHERE examples_fts MATCH ?
      ORDER BY relevance_score DESC
      LIMIT ?
    `);

    const results = stmt.all(expandedQuery, limit) as (ExampleEntry & { highlighted_code: string })[];
    const endTime = performance.now();

    return {
      results,
      total: results.length,
      query,
      search_time_ms: Math.round(endTime - startTime),
    };
  }

  searchComponents(query: string, limit: number = 5): SearchResult<ComponentEntry> {
    const startTime = performance.now();
    const expandedQuery = this.expandQuery(query);

    const stmt = this.db.prepare(`
      SELECT c.*,
             snippet(components_fts, 4, '<mark>', '</mark>', '...', 64) as highlighted_usage,
             bm25(components_fts, 2.0, 1.5, 1.0, 0.8, 0.6, 0.4, 0.3, 0.2) as relevance_score
      FROM components c
      JOIN components_fts ON c.id = components_fts.rowid
      WHERE components_fts MATCH ?
      ORDER BY relevance_score DESC
      LIMIT ?
    `);

    const results = stmt.all(expandedQuery, limit) as (ComponentEntry & { highlighted_usage: string })[];
    const endTime = performance.now();

    return {
      results,
      total: results.length,
      query,
      search_time_ms: Math.round(endTime - startTime),
    };
  }

  populateFromFolders(dataDir: string, forceResync: boolean = false): void {
    const knowledgeDir = join(dataDir, 'knowledge');
    const examplesDir = join(dataDir, 'examples');
    const componentsDir = join(dataDir, 'components');

    // Check if data already exists
    const knowledgeCount = this.db.prepare('SELECT COUNT(*) as count FROM knowledge').get() as { count: number };
    const examplesCount = this.db.prepare('SELECT COUNT(*) as count FROM examples').get() as { count: number };
    const componentsCount = this.db.prepare('SELECT COUNT(*) as count FROM components').get() as { count: number };

    if (!forceResync && knowledgeCount.count > 0 && examplesCount.count > 0 && componentsCount.count > 0) {
      console.log('📚 Database already populated. Use --force to resync.');
      return;
    }

    console.log('🔄 Populating shadcn-svelte database...');

    // Clear existing data if force resyncing
    if (forceResync) {
      this.db.exec('DELETE FROM knowledge');
      this.db.exec('DELETE FROM examples');
      this.db.exec('DELETE FROM components');
    }

    // Load knowledge, examples, and components
    this.loadKnowledgeFromFolder(knowledgeDir);
    this.loadExamplesFromFolder(examplesDir);
    this.loadComponentsFromFolder(componentsDir);

    const newKnowledgeCount = this.db.prepare('SELECT COUNT(*) as count FROM knowledge').get() as { count: number };
    const newExamplesCount = this.db.prepare('SELECT COUNT(*) as count FROM examples').get() as { count: number };
    const newComponentsCount = this.db.prepare('SELECT COUNT(*) as count FROM components').get() as { count: number };

    console.log(`✅ Database populated: ${newKnowledgeCount.count} knowledge, ${newExamplesCount.count} examples, ${newComponentsCount.count} components`);
  }

  private loadKnowledgeFromFolder(folderPath: string): void {
    if (!existsSync(folderPath)) return;

    const { loadJsonlFromDirectory } = require('./utils/jsonl.js');
    const entries = loadJsonlFromDirectory(folderPath) as KnowledgeEntry[];

    const insertStmt = this.db.prepare(`
      INSERT INTO knowledge (question, answer, category, tags)
      VALUES (?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      for (const entry of entries) {
        insertStmt.run(
          entry.question,
          entry.answer,
          entry.category || 'general',
          JSON.stringify(entry.tags || [])
        );
      }
    })();
  }

  private loadExamplesFromFolder(folderPath: string): void {
    if (!existsSync(folderPath)) return;

    const { loadJsonlFromDirectory } = require('./utils/jsonl.js');
    const entries = loadJsonlFromDirectory(folderPath) as ExampleEntry[];

    const insertStmt = this.db.prepare(`
      INSERT INTO examples (title, description, component, code, category, tags, complexity, dependencies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      for (const entry of entries) {
        insertStmt.run(
          entry.title,
          entry.description,
          entry.component,
          entry.code,
          entry.category || 'general',
          JSON.stringify(entry.tags || []),
          entry.complexity || 'intermediate',
          JSON.stringify(entry.dependencies || [])
        );
      }
    })();
  }

  private loadComponentsFromFolder(folderPath: string): void {
    if (!existsSync(folderPath)) return;

    const { loadJsonlFromDirectory } = require('./utils/jsonl.js');
    const entries = loadJsonlFromDirectory(folderPath) as ComponentEntry[];

    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO components (name, description, category, props, usage, installation, variants, dependencies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      for (const entry of entries) {
        insertStmt.run(
          entry.name,
          entry.description,
          entry.category || 'general',
          JSON.stringify(entry.props || {}),
          entry.usage,
          entry.installation,
          JSON.stringify(entry.variants || []),
          JSON.stringify(entry.dependencies || [])
        );
      }
    })();
  }

  close(): void {
    this.db.close();
  }
}