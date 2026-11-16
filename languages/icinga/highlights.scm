; Generic patterns come first: in Zed later patterns take precedence.

(identifier) @variable

((identifier) @constant
  (#match? @constant "^[A-Z]"))

(comment) @comment

; Literals

(string) @string

(multiline_string) @string

(escape_sequence) @string.escape

(macro) @string.special

(system_path) @string.special

(number) @number

(boolean) @boolean

(null) @constant.builtin

[
  (this)
  (globals)
  (locals)
] @variable.special

[
  (current_filename)
  (current_line)
] @constant.builtin

; Declarations

(type_identifier) @type

(object_declaration
  name: (string
    (string_content) @title))

(template_declaration
  name: (string
    (string_content) @title))

(apply_rule
  name: (string
    (string_content) @title))

(const_declaration
  name: (constant) @constant)

(function_declaration
  name: (identifier) @function)

(parameters
  (identifier) @variable.parameter)

(lambda
  parameters: (identifier) @variable.parameter)

(use_item
  name: (identifier) @variable.parameter)

(apply_for
  key: (identifier) @variable.parameter)

(apply_for
  value: (identifier) @variable.parameter)

; Attributes

(property_identifier) @property

(assignment
  left: (identifier) @property)

(variable_declaration
  left: (identifier) @variable)

; Calls

(call_expression
  function: (identifier) @function)

(call_expression
  function: (member_expression
    property: (property_identifier) @function.method))

(call_expression
  function: (identifier) @function.builtin
  (#any-of? @function.builtin
    "regex" "match" "cidr_match" "range" "len" "union" "intersection" "keys"
    "string" "number" "bool" "random" "log" "typeof" "get_time"
    "parse_performance_data" "dictionary" "array" "assert" "sleep" "macro"
    "get_check_command" "get_event_command" "get_notification_command"
    "get_host" "get_service" "get_services" "get_user" "get_host_group"
    "get_service_group" "get_user_group" "get_time_period" "get_object"
    "get_objects" "get_template" "get_templates" "escape_shell_arg"
    "escape_shell_cmd" "escape_create_process_arg" "path_exists" "glob"
    "glob_recursive" "basename" "dirname" "exit" "msi_get_component_path"
    "track_parents" "Json" "Math"))

; Keywords

[
  "object"
  "template"
  "apply"
  "to"
  "import"
  "assign"
  "ignore"
  "where"
  "use"
  "const"
  "var"
  "function"
  "namespace"
  "using"
  "library"
  (default)
  (ignore_on_error)
] @keyword

[
  "include"
  "include_recursive"
  "include_zones"
] @keyword.import

[
  "if"
  "else"
  "for"
  "while"
  "in"
  "return"
  "try"
  "except"
  "throw"
  (break_statement)
  (continue_statement)
  (debugger_statement)
] @keyword.control

; Operators and punctuation

[
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "^="
  "&="
  "|="
  "=>"
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
  "~"
  "&"
  "|"
  "^"
  "<<"
  ">>"
  "<"
  "<="
  ">"
  ">="
  "=="
  "!="
  "!in"
  "&&"
  "||"
  "?"
  ":"
] @operator

[
  "."
  ","
  ";"
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "{{"
  "}}"
] @punctuation.bracket
