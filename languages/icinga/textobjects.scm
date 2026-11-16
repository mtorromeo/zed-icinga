(function_declaration
  body: (block "{" (_)* @function.inside "}")) @function.around

(function_expression
  body: (block "{" (_)* @function.inside "}")) @function.around

(lambda) @function.around

(object_declaration
  body: (block "{" (_)* @class.inside "}")) @class.around

(template_declaration
  body: (block "{" (_)* @class.inside "}")) @class.around

(apply_rule
  body: (block "{" (_)* @class.inside "}")) @class.around

(comment)+ @comment.around
