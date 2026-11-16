# Icinga for Zed

Support for the [Icinga 2 configuration language](https://icinga.com/docs/icinga-2/latest/doc/17-language-reference/)
in the [Zed](https://zed.dev) editor:

- syntax highlighting (objects, templates, apply rules, runtime macros like
  `$host.name$`, durations, `{{{ multi-line strings }}}`, lambdas, …)
- outline of objects, templates, apply rules, functions and constants
- bracket matching, auto-indentation and comment toggling
- text objects for objects/templates/apply rules (`class`) and functions

The tree-sitter grammar lives in [`grammar/`](grammar/) and follows the
official Icinga 2 lexer and parser (`lib/config/config_lexer.ll` and
`lib/config/config_parser.yy`).

## File associations

Icinga 2 configuration files usually have the generic `.conf` extension, which
is shared with many other formats, so the extension only claims files ending in
`icinga2.conf`, `.icinga2` and `.icinga`.

Associate other files through
[`file_types`](https://zed.dev/docs/configuring-languages#file-associations)
in your Zed settings, for example:

```json
{
  "file_types": {
    "Icinga": ["**/icinga2/**/*.conf", "**/zones.d/**/*.conf"]
  }
}
```

## Development

```sh
cd grammar
tree-sitter generate
tree-sitter test
tree-sitter parse ../examples/icinga2.conf
```

Install the extension in Zed with `zed: install dev extension` and select this
directory. Zed fetches the grammar from the `repository` and `rev` declared in
`extension.toml`: after changing the grammar, commit it and update `rev`.
