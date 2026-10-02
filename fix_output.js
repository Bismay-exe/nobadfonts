import fs from 'fs';

const header = `F
Font Researcher & JSON Generator
Name
Font Researcher & JSON Generator
Description
Research any font by uploading font files or entering a font name (with optional designer/foundry). Search and verify authoritative web sources, identify the designer, foundry, publisher, licensing, official links, history, classification, and technical details, then return a clean, accurate JSON file using the NoBadFonts canonical schema. Never guess or fabricate information.
Instructions
`;

const instructions = fs.readFileSync('gemini-gem-instruction-font-researcher-and-json-generator.txt', 'utf8');

fs.writeFileSync('output.json', header + instructions);
console.log('Successfully updated output.json with the latest instructions!');
