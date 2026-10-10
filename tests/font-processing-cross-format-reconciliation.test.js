import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileNerdFontCrossFormatWeights } from '../scripts/font-processing/reconcile-nerdfont-cross-format.js';

function asset(source_label, relative_path, extension, weight_class, subfamily_name = 'Bold') {
  return {
    source_label,
    relative_path,
    extension,
    sha256: (source_label === 'nerdfonts' ? 'a' : 'b').repeat(64),
    metadata: {
      status: 'parsed',
      family_name: 'Monaspace Krypton NF',
      subfamily_name,
      full_name: source_label === 'nerdfonts' ? 'Monaspace Krypton NF Bold' : 'Monaspace Xenon Var',
      postscript_name: source_label === 'nerdfonts' ? 'MonaspaceKryptonNF-Bold' : 'MonaspaceXenonVar-Regular',
      weight_class,
      is_italic: false,
      extension,
    },
  };
}

test('reconciles a WOFF/WOFF2 weight only from an exact matching OTF sibling', () => {
  const input = { queue_items: [{ slug: 'monaspace', assets: [
    asset('nerdfonts', 'NerdFonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.otf', '.otf', 700),
    asset('webfont-nerdfonts', 'NerdFonts Web Fonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.woff', '.woff', 400),
    asset('webfont-nerdfonts', 'NerdFonts Web Fonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.woff2', '.woff2', 400),
  ] }] };

  const { report, summary } = reconcileNerdFontCrossFormatWeights(input);
  const assets = report.queue_items[0].assets;
  assert.deepEqual(assets.map((item) => item.metadata.weight_class), [700, 700, 700]);
  assert.equal(summary[0].reconciled_asset_count, 2);
  assert.equal(assets[1].metadata.weight_class_reconciliation.method, 'exact_cross_format_sibling');
  assert.equal(assets[1].metadata.weight_class_reconciliation.unresolved_name_table_mismatch, true);
  assert.equal(input.queue_items[0].assets[1].metadata.weight_class, 400, 'input report remains unchanged');
});

test('does not reconcile when the OTF family/subfamily or weight evidence conflicts', () => {
  const noFamilyMatch = asset('nerdfonts', 'NerdFonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.otf', '.otf', 700);
  const wrongSubfamily = asset('webfont-nerdfonts', 'NerdFonts Web Fonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.woff2', '.woff2', 400, 'Regular');
  const result = reconcileNerdFontCrossFormatWeights({ queue_items: [{ slug: 'monaspace', assets: [noFamilyMatch, wrongSubfamily] }] });
  assert.equal(result.report.queue_items[0].assets[1].metadata.weight_class, 400);
  assert.equal(result.summary[0].reconciled_asset_count, 0);
});

test('does not reconcile when sibling evidence is missing or ambiguous', () => {
  const otf1 = asset('nerdfonts', 'NerdFonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.otf', '.otf', 700);
  const otf2 = { ...otf1, sha256: 'c'.repeat(64), metadata: { ...otf1.metadata, weight_class: 800 } };
  const woff = asset('webfont-nerdfonts', 'NerdFonts Web Fonts/Monaspace Krypton/MonaspaceKryptonNF-Bold.woff', '.woff', 400);
  const result = reconcileNerdFontCrossFormatWeights({ queue_items: [{ slug: 'monaspace', assets: [otf1, otf2, woff] }] });
  assert.equal(result.report.queue_items[0].assets[2].metadata.weight_class, 400);
  assert.equal(result.summary[0].reconciled_asset_count, 0);
});
