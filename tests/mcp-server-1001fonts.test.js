import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PATTERN_1001FONTS,
  isValid1001FontsUrl,
  normalize1001FontsUrl,
  handleUploadFontJson,
  handleUploadMultipleFontsJson,
  TOOLS
} from '../scripts/mcp-server.js';

test('1001fonts URL regex and helpers in mcp-server.js', () => {
  assert.equal(isValid1001FontsUrl('https://www.1001fonts.com/great-font-font.html'), true);
  assert.equal(isValid1001FontsUrl('http://1001fonts.com/great-font-font.html?source=tracker'), true);
  assert.equal(isValid1001FontsUrl('https://example.com/great-font.html'), false);
  assert.equal(isValid1001FontsUrl(null), false);

  assert.equal(
    normalize1001FontsUrl('https://1001fonts.com/Great-Font-font.html?foo=bar#section'),
    'https://www.1001fonts.com/great-font-font.html'
  );
});

test('MCP TOOLS registry defines source_1001fonts on upload tools', () => {
  const uploadTool = TOOLS.find(t => t.name === 'upload_font_json');
  assert.ok(uploadTool, 'upload_font_json tool exists');
  assert.ok(uploadTool.inputSchema.properties.source_1001fonts, 'source_1001fonts property exists on upload_font_json');

  const uploadMultipleTool = TOOLS.find(t => t.name === 'upload_multiple_fonts_json');
  assert.ok(uploadMultipleTool, 'upload_multiple_fonts_json tool exists');
  const itemProps = uploadMultipleTool.inputSchema.properties.fonts.items.properties;
  assert.ok(itemProps.source_1001fonts, 'source_1001fonts exists on upload_multiple_fonts_json items');
});

test('handleUploadFontJson validation: rejects invalid 1001fonts URL and missing sources', async () => {
  // Missing both release_zips and source_1001fonts
  const resMissing = await handleUploadFontJson({
    json: { identity: { name: 'Test Font' } }
  });
  assert.equal(resMissing.isError, true);
  assert.equal(resMissing.error_type, 'MISSING_SOURCE_OR_ZIPS');

  // Invalid 1001fonts URL
  const resInvalid = await handleUploadFontJson({
    json: { identity: { name: 'Test Font' } },
    source_1001fonts: 'https://evil-site.com/font.html'
  });
  assert.equal(resInvalid.isError, true);
  assert.equal(resInvalid.error_type, 'INVALID_1001FONTS_URL');
});

test('handleUploadFontJson creates font and queues 1001fonts source URL', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    const method = options.method || 'GET';

    // Mock query checks
    if (method === 'GET' && String(url).includes('/rest/v1/fonts?slug=')) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'GET' && String(url).includes('/rest/v1/profiles')) {
      return new Response(JSON.stringify([{ id: 'mock-admin-uuid' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Mock font insertion
    if (method === 'POST' && String(url).includes('/rest/v1/fonts')) {
      const payload = JSON.parse(options.body);
      return new Response(JSON.stringify([{
        id: 'mock-font-uuid-1001',
        name: payload.name,
        slug: payload.slug
      }]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // Mock queue insertion
    if (method === 'POST' && String(url).includes('/rest/v1/font_processing_queue')) {
      const payload = JSON.parse(options.body);
      return new Response(JSON.stringify([{
        id: 'mock-queue-uuid-1001',
        font_id: payload.font_id,
        status: payload.status
      }]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // Mock audit log insertion
    if (method === 'POST' && String(url).includes('/rest/v1/audit_logs')) {
      return new Response(JSON.stringify([]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const res = await handleUploadFontJson({
      json: {
        identity: { name: 'Acme Slab' },
        creator: { designer: 'Jane Doe' },
        license: { license_type: 'OFL 1.1', commercial_use: true }
      },
      source_1001fonts: 'http://1001fonts.com/Acme-Slab-Font.html?ref=test'
    });

    assert.equal(res.success, true);
    assert.equal(res.slug, 'acme-slab');
    assert.equal(res.source_1001fonts, 'https://www.1001fonts.com/acme-slab-font.html');
    assert.equal(res.queue_id, 'mock-queue-uuid-1001');
    assert.equal(res.status, 'queued_for_processing');
    assert.ok(res.message.includes('1001Fonts'));

    // Verify font insert payload
    const fontPost = requests.find(r => r.options.method === 'POST' && r.url.includes('/rest/v1/fonts'));
    assert.ok(fontPost, 'Font POST request executed');
    const fontBody = JSON.parse(fontPost.options.body);
    assert.equal(fontBody.name, 'Acme Slab');
    assert.equal(fontBody.slug, 'acme-slab');
    assert.equal(fontBody.taxonomy.official_links.source_1001fonts, 'https://www.1001fonts.com/acme-slab-font.html');

    // Verify queue insert payload
    const queuePost = requests.find(r => r.options.method === 'POST' && r.url.includes('/rest/v1/font_processing_queue'));
    assert.ok(queuePost, 'Queue POST request executed');
    const queueBody = JSON.parse(queuePost.options.body);
    assert.equal(queueBody.font_id, 'mock-font-uuid-1001');
    assert.equal(queueBody.slug, 'acme-slab');
    assert.equal(queueBody.source_1001fonts, 'https://www.1001fonts.com/acme-slab-font.html');
    assert.deepEqual(queueBody.download_urls, []);
    assert.equal(queueBody.status, 'pending');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('handleUploadMultipleFontsJson passes source_1001fonts to each font', async () => {
  const originalFetch = globalThis.fetch;
  const queuePayloads = [];

  globalThis.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    if (method === 'GET' && String(url).includes('/rest/v1/fonts?slug=')) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'GET' && String(url).includes('/rest/v1/profiles')) {
      return new Response(JSON.stringify([{ id: 'mock-admin-uuid' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'POST' && String(url).includes('/rest/v1/fonts')) {
      const payload = JSON.parse(options.body);
      return new Response(JSON.stringify([{ id: 'mock-font-' + payload.slug, name: payload.name, slug: payload.slug }]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'POST' && String(url).includes('/rest/v1/font_processing_queue')) {
      const payload = JSON.parse(options.body);
      queuePayloads.push(payload);
      return new Response(JSON.stringify([{ id: 'mock-queue-' + payload.slug, font_id: payload.font_id, status: payload.status }]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'POST' && String(url).includes('/rest/v1/audit_logs')) {
      return new Response(JSON.stringify([]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const res = await handleUploadMultipleFontsJson({
      fonts: [
        {
          json: { identity: { name: 'Batch Font One' } },
          source_1001fonts: 'https://www.1001fonts.com/batch-one-font.html'
        },
        {
          json: {
            identity: { name: 'Batch Font Two' },
            source_1001fonts: 'https://www.1001fonts.com/batch-two-font.html'
          }
        }
      ]
    });

    assert.equal(res.total, 2);
    assert.equal(res.uploaded, 2);
    assert.equal(res.failed, 0);
    assert.equal(queuePayloads.length, 2);
    assert.equal(queuePayloads[0].source_1001fonts, 'https://www.1001fonts.com/batch-one-font.html');
    assert.equal(queuePayloads[1].source_1001fonts, 'https://www.1001fonts.com/batch-two-font.html');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
