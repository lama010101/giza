declare module 'json-schema-to-markdown' {
  function schemaToMarkdown(
    schema: Record<string, unknown>,
    startingOctothorpes?: string | number,
  ): string;
  export default schemaToMarkdown;
}
