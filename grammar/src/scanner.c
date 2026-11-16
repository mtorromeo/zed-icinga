#include "tree_sitter/parser.h"

#include <stdbool.h>

enum TokenType {
  NEWLINE,
  ERROR_SENTINEL,
};

void *tree_sitter_icinga_external_scanner_create(void) { return NULL; }

void tree_sitter_icinga_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_icinga_external_scanner_serialize(void *payload, char *buffer) { return 0; }

void tree_sitter_icinga_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

static bool is_word_char(int32_t c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_';
}

static bool is_space(int32_t c) { return c == ' ' || c == '\t' || c == '\f' || c == '\v'; }

static bool is_newline(int32_t c) { return c == '\n' || c == '\r'; }

/*
 * Emits a statement-terminating newline token. The parser only asks for it
 * where a statement may end, which mirrors Icinga's lexer: newlines are
 * significant except where the grammar cannot accept them (e.g. inside
 * parentheses or in the middle of an expression).
 */
bool tree_sitter_icinga_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  if (valid_symbols[ERROR_SENTINEL] || !valid_symbols[NEWLINE]) {
    return false;
  }

  while (is_space(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }

  if (!is_newline(lexer->lookahead)) {
    return false;
  }

  while (is_newline(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }
  lexer->mark_end(lexer);
  lexer->result_symbol = NEWLINE;

  /* Peek at the next token: an `else` on a new line continues an `if`. */
  while (is_space(lexer->lookahead) || is_newline(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }

  const char *keyword = "else";
  for (const char *k = keyword; *k; k++) {
    if (lexer->lookahead != *k) {
      return true;
    }
    lexer->advance(lexer, false);
  }

  return is_word_char(lexer->lookahead);
}
