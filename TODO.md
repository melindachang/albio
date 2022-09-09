# Features
- [ ] Parse markup
- [ ] Parse JS
- [ ] Create templates
- [ ] Extract logic into different files

# Research
- [ ] What `acorn` and `code_red` do
- [ ] Everything about the AST we're setting up
- [ ] How Svelte compiler avoids diffing and VDom
- [ ] Differences between `parse5` and Svelte custom parser, see if it's worth implementing the latter
    - [ ] Look into [docs](https://svelte.dev/docs#compile-time-svelte-parse) on the `svelte.parse()` method
- [ ] How to get everything (e.g. `parseFragment()` method from `parse5`) to adhere to the return types we set with a template