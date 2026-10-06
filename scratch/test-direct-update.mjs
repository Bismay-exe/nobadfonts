import { handleUpdateFontJson, handleGetFont } from '../scripts/mcp-server.js';

// Let's test get_font for Nobulina
console.log('1. Fetching font via get_font...');
const before = await handleGetFont({ slug: 'nobulina' });
console.log('Before update:');
console.log('- release_year:', before.canonical_taxonomy_json.identity.release_year);
console.log('- glyph_count:', before.canonical_taxonomy_json.technical.glyph_count);
console.log('- description:', before.canonical_taxonomy_json.description.description);

// Let's test direct update via update_font_json
console.log('\n2. Applying direct update via update_font_json...');
const updateRes = await handleUpdateFontJson({
  slug: 'nobulina',
  json: {
    description: {
      description: 'Nobulina is a high-contrast experimental display typeface featuring bold condensed proportions and tactile stroke dynamics.',
      characteristics: 'High contrast, condensed vertical metrics, experimental display shapes'
    },
    classification: {
      category: 'display',
      tags: ['display', 'experimental', 'condensed', 'bold', 'headline']
    }
  },
  rationale: 'Direct autonomous MCP test update'
});

console.log('Update result status:', updateRes.success, 'verified_in_db:', updateRes.verified_in_db);
console.log('Changed fields:', updateRes.changed_fields);

// Let's verify read-after-write
console.log('\n3. Verifying read-after-write via get_font...');
const after = await handleGetFont({ slug: 'nobulina' });
console.log('After update in DB:');
console.log('- description:', after.canonical_taxonomy_json.description.description);
console.log('- tags:', after.canonical_taxonomy_json.classification.tags);
console.log('- release_year (remains strictly null):', after.canonical_taxonomy_json.identity.release_year);
console.log('- glyph_count (remains strictly null):', after.canonical_taxonomy_json.technical.glyph_count);

if (after.canonical_taxonomy_json.description.description.includes('Nobulina is a high-contrast experimental')) {
  console.log('\n✅ DIRECT PRODUCTION UPDATE WORKS PERFECTLY!');
} else {
  console.error('\n❌ DIRECT UPDATE FAILED TO PERSIST!');
}
