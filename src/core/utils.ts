import { js as beautifyJS } from 'js-beautify';

export function format(code: string) {
  return beautifyJS(code, {
    indent_size: 2,
    max_preserve_newlines: 2,
    preserve_newlines: true,
    keep_array_indentation: false,
    break_chained_methods: false,
    brace_style: 'collapse',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: false,
    wrap_line_length: 0,
    comma_first: false,
    e4x: false,
    indent_empty_lines: false,
  });
}
