(object_declaration
  "object" @context
  type: (type_identifier) @context
  name: (_) @name) @item

(template_declaration
  "template" @context
  type: (type_identifier) @context
  name: (_) @name) @item

(apply_rule
  "apply" @context
  type: (type_identifier) @context
  name: (_)? @name
  "to"? @context
  target: (type_identifier)? @context) @item

(function_declaration
  "function" @context
  name: (identifier) @name
  parameters: (parameters) @context) @item

(namespace_declaration
  "namespace" @context
  name: (_) @name) @item

(source_file
  (const_declaration
    "const" @context
    name: (constant) @name) @item)
