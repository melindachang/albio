import { js as beautifyJS } from 'js-beautify';

export function format(code: string) {
  return beautifyJS(code, {
    end_with_newline: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    brace_style: 'collapse',
    space_before_conditional: true,
    jslint_happy: false,
    indent_size: 2,
    wrap_line_length: 0,
    comma_first: false,
    max_preserve_newlines: 2,
    preserve_newlines: true,
    e4x: false,
    indent_empty_lines: false,
    unescape_strings: false,
  });
}
