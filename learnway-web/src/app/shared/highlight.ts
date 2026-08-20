import { parser as javaParser } from '@lezer/java';
import { highlightTree, tagHighlighter, tags } from '@lezer/highlight';

/**
 * Realce de sintaxe estático para os blocos de código do markdown
 * (teoria, lições, chat da IA) — "moldura de IDE", estilo IntelliJ.
 *
 * Java usa o parser real do Lezer (o mesmo do CodeMirror, já nas dependências),
 * então o realce entende a gramática de verdade: distingue tipo de variável, o
 * nome que está sendo declarado, modificadores de visibilidade, etc.
 * SQL usa um tokenizador simples por regex — suficiente para os exemplos.
 *
 * As classes emitidas (`hl-*`) são estilizadas em `styles.scss`.
 */

/** Tags do Lezer -> nossas classes CSS. */
const JAVA_HIGHLIGHTER = tagHighlighter([
  // modificadores de visibilidade/escopo: public, private, protected, static, final…
  { tag: tags.modifier, class: 'hl-mod' },
  // palavras-chave: class, return, new, if, extends…
  {
    tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.operatorKeyword, tags.moduleKeyword, tags.self],
    class: 'hl-kw',
  },
  // tipos e classes: String, Long, Usuario, Optional…
  { tag: [tags.typeName, tags.standard(tags.typeName), tags.className], class: 'hl-type' },
  // o nome sendo declarado (o campo/método/classe que esta linha cria)
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName)], class: 'hl-def' },
  { tag: [tags.propertyName, tags.labelName], class: 'hl-prop' },
  { tag: tags.variableName, class: 'hl-var' },
  { tag: [tags.string, tags.character], class: 'hl-str' },
  { tag: [tags.integer, tags.float], class: 'hl-num' },
  { tag: [tags.bool, tags.null], class: 'hl-lit' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], class: 'hl-cmt' },
  {
    tag: [
      tags.operator, tags.arithmeticOperator, tags.logicOperator, tags.compareOperator,
      tags.bitwiseOperator, tags.updateOperator, tags.definitionOperator, tags.derefOperator,
    ],
    class: 'hl-op',
  },
  { tag: [tags.punctuation, tags.separator, tags.brace, tags.paren, tags.squareBracket], class: 'hl-punct' },
]);

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/**
 * Converte um mapa "classe por caractere" em HTML, agrupando trechos vizinhos
 * de mesma classe num único <span>.
 */
function toHtml(code: string, classes: (string | null)[]): string {
  let html = '';
  let start = 0;

  while (start < code.length) {
    const cls = classes[start];
    let end = start + 1;
    while (end < code.length && classes[end] === cls) end++;

    const chunk = escapeHtml(code.slice(start, end));
    html += cls ? `<span class="${cls}">${chunk}</span>` : chunk;
    start = end;
  }

  return html;
}

/** Java: parser real + tratamento especial das anotações (@Entity, @Column…). */
function highlightJava(code: string): string {
  const tree = javaParser.parse(code);
  const classes: (string | null)[] = new Array(code.length).fill(null);

  highlightTree(tree, JAVA_HIGHLIGHTER, (from, to, cls) => {
    for (let i = from; i < to; i++) classes[i] = cls;
  });

  // A gramática marca a anotação como identificador comum. Repintamos só o
  // "@Nome" (sem os argumentos, que mantêm o realce normal) — como no IntelliJ.
  tree.iterate({
    enter(node) {
      if (node.name !== 'Annotation' && node.name !== 'MarkerAnnotation') return;
      const name = node.node.getChild('Identifier') ?? node.node.getChild('ScopedIdentifier');
      const end = name ? name.to : node.to;
      for (let i = node.from; i < end; i++) classes[i] = 'hl-ann';
    },
  });

  return toHtml(code, classes);
}

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create',
  'table', 'alter', 'drop', 'index', 'primary', 'key', 'foreign', 'references', 'constraint',
  'not', 'null', 'unique', 'default', 'cascade', 'join', 'inner', 'left', 'right', 'outer',
  'full', 'on', 'and', 'or', 'in', 'is', 'exists', 'like', 'ilike', 'between', 'order', 'by',
  'group', 'having', 'limit', 'offset', 'as', 'distinct', 'union', 'all', 'asc', 'desc',
  'case', 'when', 'then', 'else', 'end', 'begin', 'commit', 'rollback', 'transaction',
]);

const SQL_TYPES = new Set([
  'bigint', 'int', 'integer', 'smallint', 'serial', 'bigserial', 'varchar', 'char', 'text',
  'boolean', 'bool', 'timestamp', 'timestamptz', 'date', 'time', 'numeric', 'decimal',
  'real', 'double', 'precision', 'uuid', 'json', 'jsonb', 'bytea',
]);

const SQL_FUNCTIONS = new Set(['count', 'sum', 'avg', 'min', 'max', 'coalesce', 'now', 'cast', 'size']);

/** SQL: tokenizador por regex (comentários, strings, números, palavras, símbolos). */
function highlightSql(code: string): string {
  const classes: (string | null)[] = new Array(code.length).fill(null);

  const token =
    /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.|'')*'|"(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*|[(),;.*=<>+\-/|]/g;

  for (let m = token.exec(code); m !== null; m = token.exec(code)) {
    const text = m[0];
    let cls: string;

    if (text.startsWith('--') || text.startsWith('/*')) cls = 'hl-cmt';
    else if (text.startsWith("'") || text.startsWith('"')) cls = 'hl-str';
    else if (/^\d/.test(text)) cls = 'hl-num';
    else if (/^[A-Za-z_]/.test(text)) {
      const word = text.toLowerCase();
      if (SQL_KEYWORDS.has(word)) cls = 'hl-kw';
      else if (SQL_TYPES.has(word)) cls = 'hl-type';
      else if (SQL_FUNCTIONS.has(word)) cls = 'hl-prop';
      else cls = 'hl-var';
    } else cls = 'hl-punct';

    for (let i = m.index; i < m.index + text.length; i++) classes[i] = cls;
  }

  return toHtml(code, classes);
}

/** Normaliza o que vem depois das crases: ```java, ```Java, ```java:Usuario.java */
function normalizeLang(lang: string | undefined): string {
  return (lang ?? '').trim().split(/[\s:]/)[0].toLowerCase();
}

/**
 * Realça um bloco de código, devolvendo HTML já escapado e seguro.
 * Linguagem desconhecida (ou `text`) sai apenas escapada, sem realce.
 */
export function highlightCodeBlock(code: string, lang?: string): string {
  const language = normalizeLang(lang);

  try {
    if (language === 'java') return highlightJava(code);
    if (language === 'sql') return highlightSql(code);
  } catch {
    /* qualquer falha no realce cai no texto puro — nunca quebra a página */
  }

  return escapeHtml(code);
}
