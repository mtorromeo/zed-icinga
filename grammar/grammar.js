/**
 * @file Icinga 2 configuration language grammar for tree-sitter
 * @license MIT
 *
 * Modeled after the official lexer/parser of Icinga 2
 * (lib/config/config_lexer.ll and lib/config/config_parser.yy).
 *
 * Newlines are statement separators in Icinga 2. The external scanner emits a
 * `_newline` token only where a statement may end, so that expressions are not
 * continued across lines (e.g. a line starting with `*` or `-`). `;` and `,`
 * are accepted as separators as well, and statements on the same line may also
 * follow each other without one.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Precedence levels, from the %left/%right declarations of config_parser.yy
// (lowest first).
const PREC = {
  lambda: 1,
  assign: 2,
  ternary: 3,
  logical_or: 4,
  logical_and: 5,
  bitwise_or: 6,
  bitwise_xor: 7,
  bitwise_and: 8,
  equality: 9,
  in: 10,
  relational: 11,
  shift: 12,
  additive: 13,
  multiplicative: 14,
  unary: 15,
  ref: 16,
  not: 17,
  postfix: 18,
};

const ASSIGNMENT_OPERATORS = ['=', '+=', '-=', '*=', '/=', '%=', '^=', '&=', '|='];

/**
 * @param {RuleOrLiteral} rule
 * @param {RuleOrLiteral} separator
 */
function sepBy1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

/**
 * @param {RuleOrLiteral} rule
 */
function commaSep(rule) {
  return optional(seq(sepBy1(rule, ','), optional(',')));
}

module.exports = grammar({
  name: 'icinga',

  extras: $ => [/\s/, $.comment],

  // _newline: a line break that terminates a statement (see src/scanner.c).
  // _error_sentinel: never used, only valid during error recovery.
  externals: $ => [$._newline, $._error_sentinel],

  word: $ => $._plain_identifier,

  conflicts: $ => [
    [$.dictionary, $.block],
    [$._expression, $._name],
  ],

  supertypes: $ => [$._statement, $._expression],

  rules: {
    source_file: $ => repeat($._statement_or_separator),

    _statement_or_separator: $ => choice($._statement, ';', ',', $._newline),

    _statement: $ => choice(
      $.object_declaration,
      $.template_declaration,
      $.apply_rule,
      $.include_directive,
      $.library_directive,
      $.import_statement,
      $.assign_where,
      $.ignore_where,
      $.const_declaration,
      $.variable_declaration,
      $.assignment,
      $.function_declaration,
      $.namespace_declaration,
      $.using_statement,
      $.for_statement,
      $.while_statement,
      $.try_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.throw_statement,
      $.debugger_statement,
      $.expression_statement,
    ),

    // object Host "name" { ... }
    object_declaration: $ => seq(
      'object',
      $._object_header,
    ),

    // template Host "name" [default] { ... }
    template_declaration: $ => seq(
      'template',
      $._object_header,
    ),

    _object_header: $ => seq(
      field('type', $._type),
      optional(field('name', $._expression)),
      optional($.use_clause),
      optional($.default),
      optional($.ignore_on_error),
      field('body', $.block),
    ),

    default: _ => 'default',

    ignore_on_error: _ => 'ignore_on_error',

    // apply Service "name" for (k => v in expr) to Host { ... }
    apply_rule: $ => seq(
      'apply',
      field('type', $._type),
      optional(field('name', $._expression)),
      optional($.apply_for),
      optional(seq('to', field('target', $._type))),
      optional($.use_clause),
      optional($.ignore_on_error),
      field('body', $.block),
    ),

    apply_for: $ => seq('for', $._for_header),

    _type: $ => alias($.identifier, $.type_identifier),

    include_directive: $ => prec.right(choice(
      seq('include', field('path', choice($.system_path, $._expression))),
      seq(
        'include_recursive',
        field('path', $._expression),
        optional(seq(',', field('pattern', $._expression))),
      ),
      seq(
        'include_zones',
        field('tag', $._expression),
        ',',
        field('path', $._expression),
        optional(seq(',', field('pattern', $._expression))),
      ),
    )),

    system_path: _ => token(prec(1, /<[^ >\n]*>/)),

    library_directive: $ => seq('library', field('name', $._expression)),

    import_statement: $ => seq('import', field('template', $._expression)),

    assign_where: $ => prec.right(seq('assign', 'where', field('condition', $._expression))),

    ignore_where: $ => prec.right(seq('ignore', 'where', field('condition', $._expression))),

    const_declaration: $ => seq(
      'const',
      field('name', alias($.identifier, $.constant)),
      '=',
      field('value', $._expression),
    ),

    variable_declaration: $ => prec.right(seq(
      'var',
      field('left', $._expression),
      optional(seq(
        field('operator', choice(...ASSIGNMENT_OPERATORS)),
        field('right', $._expression),
      )),
    )),

    assignment: $ => prec.right(PREC.assign, seq(
      field('left', $._expression),
      field('operator', choice(...ASSIGNMENT_OPERATORS)),
      field('right', $._expression),
    )),

    function_declaration: $ => seq(
      'function',
      field('name', $.identifier),
      field('parameters', $.parameters),
      optional($.use_clause),
      field('body', $.block),
    ),

    namespace_declaration: $ => seq(
      'namespace',
      field('name', $._expression),
      field('body', $.block),
    ),

    using_statement: $ => seq('using', field('namespace', $._expression)),

    for_statement: $ => seq(
      'for',
      $._for_header,
      field('body', $.block),
    ),

    _for_header: $ => seq(
      '(',
      optional('var'),
      choice(
        field('value', $._name),
        seq(
          field('key', $._name),
          '=>',
          optional('var'),
          field('value', $._name),
        ),
      ),
      'in',
      field('iterable', $._expression),
      ')',
    ),

    while_statement: $ => seq(
      'while',
      '(',
      field('condition', $._expression),
      ')',
      field('body', $.block),
    ),

    try_statement: $ => seq(
      'try',
      field('body', $.block),
      'except',
      field('handler', $.block),
    ),

    return_statement: $ => prec.right(seq('return', optional($._expression))),

    break_statement: _ => 'break',

    continue_statement: _ => 'continue',

    throw_statement: $ => seq('throw', $._expression),

    debugger_statement: _ => 'debugger',

    expression_statement: $ => $._expression,

    // ---------------------------------------------------------------------
    // Expressions

    _expression: $ => choice(
      $.identifier,
      $.string,
      $.multiline_string,
      $.number,
      $.boolean,
      $.null,
      $.this,
      $.globals,
      $.locals,
      $.current_filename,
      $.current_line,
      $.array,
      $.dictionary,
      $.parenthesized_expression,
      $.member_expression,
      $.subscript_expression,
      $.call_expression,
      $.unary_expression,
      $.binary_expression,
      $.ternary_expression,
      $.if_expression,
      $.function_expression,
      $.lambda,
      $.nullary_lambda,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    member_expression: $ => prec(PREC.postfix, seq(
      field('object', $._expression),
      '.',
      field('property', alias($.identifier, $.property_identifier)),
    )),

    subscript_expression: $ => prec(PREC.postfix, seq(
      field('object', $._expression),
      '[',
      field('index', $._expression),
      ']',
    )),

    call_expression: $ => prec(PREC.postfix, seq(
      field('function', $._expression),
      field('arguments', $.arguments),
    )),

    arguments: $ => seq('(', commaSep($._expression), ')'),

    unary_expression: $ => choice(
      ...[
        ['!', PREC.not],
        ['~', PREC.not],
        ['&', PREC.ref],
        ['*', PREC.ref],
        ['-', PREC.unary],
        ['+', PREC.unary],
      ].map(([operator, precedence]) => prec(/** @type {number} */ (precedence), seq(
        field('operator', /** @type {string} */ (operator)),
        field('argument', $._expression),
      ))),
    ),

    binary_expression: $ => choice(
      ...[
        ['||', PREC.logical_or],
        ['&&', PREC.logical_and],
        ['|', PREC.bitwise_or],
        ['^', PREC.bitwise_xor],
        ['&', PREC.bitwise_and],
        ['==', PREC.equality],
        ['!=', PREC.equality],
        ['in', PREC.in],
        ['!in', PREC.in],
        ['<', PREC.relational],
        ['<=', PREC.relational],
        ['>', PREC.relational],
        ['>=', PREC.relational],
        ['<<', PREC.shift],
        ['>>', PREC.shift],
        ['+', PREC.additive],
        ['-', PREC.additive],
        ['*', PREC.multiplicative],
        ['/', PREC.multiplicative],
        ['%', PREC.multiplicative],
      ].map(([operator, precedence]) => prec.left(/** @type {number} */ (precedence), seq(
        field('left', $._expression),
        field('operator', /** @type {string} */ (operator)),
        field('right', $._expression),
      ))),
    ),

    ternary_expression: $ => prec.right(PREC.ternary, seq(
      field('condition', $._expression),
      '?',
      field('consequence', $._expression),
      ':',
      field('alternative', $._expression),
    )),

    if_expression: $ => prec.right(seq(
      'if',
      '(',
      field('condition', $._expression),
      ')',
      field('consequence', $.block),
      repeat($.else_if_clause),
      optional($.else_clause),
    )),

    else_if_clause: $ => seq(
      'else',
      'if',
      '(',
      field('condition', $._expression),
      ')',
      field('consequence', $.block),
    ),

    else_clause: $ => seq('else', field('body', $.block)),

    function_expression: $ => seq(
      'function',
      field('parameters', $.parameters),
      optional($.use_clause),
      field('body', $.block),
    ),

    // x => expr, (x, y) use(z) => { ... }
    lambda: $ => prec.right(PREC.lambda, seq(
      field('parameters', choice($._name, $.parameters)),
      optional($.use_clause),
      '=>',
      field('body', choice($.block, $._expression)),
    )),

    // {{ expr }}
    nullary_lambda: $ => seq('{{', repeat($._statement_or_separator), '}}'),

    parameters: $ => seq('(', commaSep($._name), ')'),

    use_clause: $ => seq('use', '(', sepBy1($.use_item, ','), ')'),

    use_item: $ => seq(
      field('name', $._name),
      optional(seq('=', field('value', $._expression))),
    ),

    _name: $ => choice($.identifier, $.string),

    array: $ => seq('[', commaSep($._expression), ']'),

    dictionary: $ => seq('{', repeat($._statement_or_separator), '}'),

    block: $ => seq('{', repeat($._statement_or_separator), '}'),

    // ---------------------------------------------------------------------
    // Terminals

    identifier: $ => choice($._plain_identifier, $._escaped_identifier),

    _plain_identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    _escaped_identifier: _ => /@[a-zA-Z_][a-zA-Z0-9_]*/,

    number: _ => /[0-9]+(\.[0-9]+)?(ms|s|m|h|d)?/,

    boolean: _ => choice('true', 'false'),

    null: _ => 'null',

    this: _ => 'this',

    globals: _ => 'globals',

    locals: _ => 'locals',

    current_filename: _ => 'current_filename',

    current_line: _ => 'current_line',

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
        $.macro,
      )),
      token.immediate('"'),
    ),

    string_content: _ => token.immediate(prec(1, choice(/[^"\\\n$]+/, '$'))),

    escape_sequence: _ => token.immediate(prec(2, choice(
      /\\[0-7]{1,3}/,
      /\\[nrtbf"\\]/,
      /\\\r?\n/,
      '$$',
    ))),

    // Runtime macros such as $host.name$ or $service.state$
    macro: _ => token.immediate(prec(2, /\$[a-zA-Z_][a-zA-Z0-9_.]*\$/)),

    // {{{ ... }}}
    multiline_string: _ => token(prec(3, /\{\{\{([^}]|\}[^}]|\}\}[^}])*\}\}\}/)),

    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('#', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    )),
  },
});
