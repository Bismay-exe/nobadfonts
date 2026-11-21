import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedCdnHost,
  generateStableGalleryFileName,
  guessExtension,
  downloadImage,
  mergeGalleryImages,
  enrichFrom1001Fonts,
} from '../scripts/font-processing/enrich-from-1001fonts.js';
import {
  isValid1001FontsUrl,
  normalize1001FontsUrl,
} from '../src/utils/urlHelper.ts';
import { createFrom1001Fonts, slugify } from '../scripts/font-processing/create-from-1001fonts.js';

test('1001fonts URL validation and normalization matches frontend and backend expectations', () => {
  // Valid patterns
  const validCases = [
    'https://www.1001fonts.com/diomeca-font.html',
    'https://1001fonts.com/diomeca-font.html',
    'http://www.1001fonts.com/fira-code-font.html',
    'https://www.1001fonts.com/Heavy-Data_01-font.html?param=value#anchor',
  ];

  for (const url of validCases) {
    assert.equal(isValid1001FontsUrl(url), true, `Expected valid: ${url}`);
    const normalized = normalize1001FontsUrl(url);
    assert.ok(normalized?.startsWith('https://www.1001fonts.com/'), `Expected normalized: ${normalized}`);
    assert.ok(normalized?.endsWith('-font.html'), `Expected ending in -font.html: ${normalized}`);
  }

  // Normalized output format
  assert.equal(
    normalize1001FontsUrl('http://1001fonts.com/Diomeca-Font.html?ref=123'),
    'https://www.1001fonts.com/diomeca-font.html'
  );

  // Invalid patterns
  const invalidCases = [
    '',
    null,
    undefined,
    'https://example.com/diomeca-font.html',
    'https://www.1001fonts.com/not-a-font-page',
    'https://www.1001fonts.com/fonts.html',
    'javascript:alert(1)',
    'https://evil1001fonts.com/test-font.html',
  ];

  for (const url of invalidCases) {
    assert.equal(isValid1001FontsUrl(url), false, `Expected invalid: ${url}`);
    assert.equal(normalize1001FontsUrl(url), null);
  }
});

test('isAllowedCdnHost validates trusted 1001fonts domains and rejects untrusted hosts', () => {
  assert.equal(isAllowedCdnHost('https://img.1001fonts.net/illustrations/123-original.avif'), true);
  assert.equal(isAllowedCdnHost('https://cdn.1001fonts.net/img/test.webp'), true);
  assert.equal(isAllowedCdnHost('https://www.1001fonts.com/img/illustrations/456.jpg'), true);
  assert.equal(isAllowedCdnHost('https://1001fonts.com/sample.png'), true);

  assert.equal(isAllowedCdnHost('https://evil.com/fake.avif'), false);
  assert.equal(isAllowedCdnHost('https://1001fonts.net.attacker.org/image.png'), false);
  assert.equal(isAllowedCdnHost('https://not1001fonts.com/img.jpg'), false);
  assert.equal(isAllowedCdnHost('not-a-url'), false);
});

test('generateStableGalleryFileName generates deterministic stable filenames', () => {
  const url1 = 'https://img.1001fonts.net/illustrations/diomeca-1.avif';
  const name1 = generateStableGalleryFileName(0, url1, 'avif');
  const name2 = generateStableGalleryFileName(0, url1, 'avif');
  const name3 = generateStableGalleryFileName(1, url1, 'avif');

  assert.equal(name1, name2, 'Same URL and index must produce identical filenames');
  assert.equal(name1.startsWith('gallery-01-'), true);
  assert.equal(name3.startsWith('gallery-02-'), true);
  assert.equal(name1.endsWith('.avif'), true);
});

test('guessExtension handles various URL parameters and content-types', () => {
  assert.equal(guessExtension('https://example.com/image.avif?w=800', 'image/avif'), 'avif');
  assert.equal(guessExtension('https://example.com/photo.JPEG', 'image/jpeg'), 'jpeg');
  assert.equal(guessExtension('https://example.com/asset-without-ext', 'image/webp'), 'webp');
  assert.equal(guessExtension('https://example.com/unknown', 'application/octet-stream'), 'avif');
});

test('downloadImage validates allowed MIME types and rejects untrusted hosts and empty responses', async () => {
  // Untrusted CDN host rejected before fetch
  await assert.rejects(
    () => downloadImage('https://evil.com/image.avif'),
    /Untrusted CDN host/
  );

  // Disallowed MIME type rejected
  const badMimeFetch = async () => ({
    ok: true,
    headers: new Map([['content-type', 'image/svg+xml']]),
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  });
  await assert.rejects(
    () => downloadImage('https://img.1001fonts.net/vector.svg', badMimeFetch),
    /Disallowed image MIME type/
  );

  // Empty response rejected
  const emptyFetch = async () => ({
    ok: true,
    headers: new Map([['content-type', 'image/avif']]),
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  await assert.rejects(
    () => downloadImage('https://img.1001fonts.net/empty.avif', emptyFetch),
    /Received empty image/
  );

  // Valid image download succeeds
  const validFetch = async () => ({
    ok: true,
    headers: new Map([['content-type', 'image/avif']]),
    arrayBuffer: async () => Buffer.from('image-bytes-payload'),
  });
  const res = await downloadImage('https://img.1001fonts.net/valid.avif', validFetch);
  assert.equal(res.contentType, 'image/avif');
  assert.equal(res.byteLength, 19);
  assert.equal(res.bytes.toString(), 'image-bytes-payload');
});

test('mergeGalleryImages preserves manually uploaded images, deduplicates, and maintains size array consistency', () => {
  const existingUrls = [
    'https://supabase.co/storage/v1/object/public/fonts/user1/test/gallery/manual-1.avif',
    'https://supabase.co/storage/v1/object/public/fonts/user1/test/gallery/manual-2.avif',
  ];
  const existingSizes = [12345, 67890];

  const newUrls = [
    'https://supabase.co/storage/v1/object/public/fonts/user1/test/gallery/manual-2.avif', // Duplicate
    'https://supabase.co/storage/v1/object/public/fonts/user1/test/gallery/gallery-01.avif',
  ];
  const newSizes = [67890, 54321];

  const { mergedUrls, mergedSizes } = mergeGalleryImages(existingUrls, existingSizes, newUrls, newSizes);

  assert.equal(mergedUrls.length, 3, 'Duplicate URL should be dropped');
  assert.equal(mergedSizes.length, 3, 'Size array length must match URL array length');
  assert.equal(mergedUrls[0], existingUrls[0]);
  assert.equal(mergedUrls[1], existingUrls[1]);
  assert.equal(mergedUrls[2], newUrls[1]);
  assert.equal(mergedSizes[0], 12345);
  assert.equal(mergedSizes[1], 67890);
  assert.equal(mergedSizes[2], 54321);
});

test('enrichFrom1001Fonts uploads images deterministically, merges gallery, preserves curated designer, and patches ZIP URL', async () => {
  const uploads = [];
  const updates = [];

  const mockSupabase = {
    from(table) {
      return {
        select() {
          return {
            eq() {
              return {
                single: async () => ({
                  data: {
                    id: 'font-1',
                    slug: 'test-font',
                    designer: 'Curated Designer', // Curated! Should not be overwritten by scraped author
                    preview_image_url: 'https://supabase.co/existing-preview.avif',
                    gallery_images: ['https://supabase.co/existing-gallery.avif'],
                    gallery_image_sizes: [1000],
                    uploaded_by: 'user-uuid-123',
                  },
                  error: null,
                }),
              };
            },
          };
        },
        update(payload) {
          return {
            eq(col, val) {
              updates.push({ table, payload, col, val });
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, 'fonts');
        return {
          upload: async (storagePath, bytes, opts) => {
            uploads.push({ storagePath, bytes, opts });
            return { error: null };
          },
          getPublicUrl: (storagePath) => ({
            data: { publicUrl: `https://supabase.co/storage/v1/object/public/fonts/${storagePath}` },
          }),
        };
      },
    },
  };

  const queueItem = {
    id: 'queue-1',
    font_id: 'font-1',
    slug: 'test-font',
    download_urls: [],
  };

  const mockScrapeResult = {
    name: 'Test Font',
    designer: 'Scraped Author',
    author: 'Scraped Author',
    author_url: 'https://www.1001fonts.com/users/scraped-author',
    images: ['https://img.1001fonts.net/illustrations/test-1.avif'],
    download_zip: 'https://www.1001fonts.com/download/test-font.zip',
  };

  const mockFetch = async () => ({
    ok: true,
    headers: new Map([['content-type', 'image/avif']]),
    arrayBuffer: async () => Buffer.from('test-image-data'),
  });

  const outcome = await enrichFrom1001Fonts(
    mockSupabase,
    queueItem,
    'https://www.1001fonts.com/test-font.html',
    {
      fetchImpl: mockFetch,
      scrapeImpl: () => mockScrapeResult,
    }
  );

  assert.equal(outcome.uploadedCount, 1);
  assert.equal(outcome.galleryUpdated, true);
  assert.equal(outcome.zipAdded, true);

  // Verify upload path format: user-uuid-123/test-font/gallery/gallery-01-<sha>.avif
  assert.equal(uploads.length, 1);
  assert.ok(uploads[0].storagePath.startsWith('user-uuid-123/test-font/gallery/gallery-01-'));
  assert.ok(uploads[0].storagePath.endsWith('.avif'));

  // Verify fonts table update preserved curated designer and existing gallery image
  const fontsUpdate = updates.find((u) => u.table === 'fonts');
  assert.ok(fontsUpdate, 'fonts table should have been updated');
  assert.equal(fontsUpdate.payload.designer, undefined, 'Curated designer must not be overwritten');
  assert.equal(fontsUpdate.payload.preview_image_url, 'https://supabase.co/existing-preview.avif', 'Curated preview must be preserved');
  assert.equal(fontsUpdate.payload.gallery_images.length, 2, 'Existing + new image merged');
  assert.equal(fontsUpdate.payload.gallery_images[0], 'https://supabase.co/existing-gallery.avif');

  // Verify queue table updated with ZIP URL
  const queueUpdate = updates.find((u) => u.table === 'font_processing_queue');
  assert.ok(queueUpdate, 'queue table download_urls should have been patched');
  assert.deepEqual(queueUpdate.payload.download_urls, [
    { url: 'https://www.1001fonts.com/download/test-font.zip', label: '1001fonts' },
  ]);
});

test('enrichFrom1001Fonts NEVER silently uses external CDN URLs when upload fails', async () => {
  const updates = [];

  const mockSupabase = {
    from(table) {
      return {
        select() {
          return {
            eq() {
              return {
                single: async () => ({
                  data: {
                    id: 'font-1',
                    slug: 'test-font',
                    designer: 'Unknown',
                    preview_image_url: null,
                    gallery_images: null,
                    gallery_image_sizes: null,
                    uploaded_by: 'user-uuid-123',
                  },
                  error: null,
                }),
              };
            },
          };
        },
        update(payload) {
          return {
            eq(col, val) {
              updates.push({ table, payload, col, val });
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    storage: {
      from() {
        return {
          upload: async () => ({ error: new Error('Simulated S3 Upload Error') }),
          getPublicUrl: () => ({ data: {} }),
        };
      },
    },
  };

  const queueItem = {
    id: 'queue-1',
    font_id: 'font-1',
    slug: 'test-font',
    download_urls: [],
  };

  const mockScrapeResult = {
    name: 'Test Font',
    designer: 'New Designer',
    author: 'New Designer',
    images: ['https://img.1001fonts.net/illustrations/test-1.avif'],
    download_zip: null,
  };

  const mockFetch = async () => ({
    ok: true,
    headers: new Map([['content-type', 'image/avif']]),
    arrayBuffer: async () => Buffer.from('test-image-data'),
  });

  const outcome = await enrichFrom1001Fonts(
    mockSupabase,
    queueItem,
    'https://www.1001fonts.com/test-font.html',
    {
      fetchImpl: mockFetch,
      scrapeImpl: () => mockScrapeResult,
    }
  );

  assert.equal(outcome.uploadedCount, 0);
  const fontsUpdate = updates.find((u) => u.table === 'fonts');
  if (fontsUpdate) {
    // If updated (e.g. for designer), gallery_images must NOT contain external CDN URLs
    if (fontsUpdate.payload.gallery_images) {
      assert.ok(
        fontsUpdate.payload.gallery_images.every((url) => !url.includes('1001fonts.net')),
        'Must not contain external CDN URLs'
      );
    }
  }
});

test('createFrom1001Fonts creates stub fonts row and queue entry without uploading gallery images', async () => {
  const inserts = [];

  const mockSupabase = {
    from(table) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: null, error: null }),
                in() {
                  return {
                    maybeSingle: async () => ({ data: null, error: null }),
                  };
                },
              };
            },
          };
        },
        insert(payload) {
          inserts.push({ table, payload });
          return {
            select() {
              return {
                single: async () => ({ data: { id: `id-${table}` }, error: null }),
              };
            },
          };
        },
      };
    },
  };

  const mockScrapeResult = {
    name: 'Diomeca',
    designer: 'Astigmatic',
    author: 'Astigmatic',
    images: ['https://img.1001fonts.net/illustrations/diomeca.avif'],
    download_zip: 'https://www.1001fonts.com/download/diomeca-font.zip',
  };

  const result = await createFrom1001Fonts({
    supabase: mockSupabase,
    fontPageUrl: 'https://www.1001fonts.com/diomeca-font.html',
    uploaderUserId: 'admin-user-uuid',
    scrapeImpl: () => mockScrapeResult,
  });

  assert.equal(result.slug, 'diomeca');
  assert.equal(result.fontId, 'id-fonts');
  assert.equal(result.queueId, 'id-font_processing_queue');

  // Verify stub font row has NO gallery images uploaded yet
  const fontInsert = inserts.find((i) => i.table === 'fonts');
  assert.ok(fontInsert);
  const fontRow = fontInsert.payload[0];
  assert.equal(fontRow.name, 'Diomeca');
  assert.equal(fontRow.slug, 'diomeca');
  assert.equal(fontRow.designer, 'Astigmatic');
  assert.equal(fontRow.gallery_images, null, 'Gallery images should be null in create stub');
  assert.equal(fontRow.preview_image_url, null, 'Preview image URL should be null in create stub');
  assert.equal(fontRow.is_published, false, 'Should be unpublished initially');

  // Verify queue entry has source_1001fonts and zip URL
  const queueInsert = inserts.find((i) => i.table === 'font_processing_queue');
  assert.ok(queueInsert);
  const queueRow = queueInsert.payload[0];
  assert.equal(queueRow.slug, 'diomeca');
  assert.equal(queueRow.source_1001fonts, 'https://www.1001fonts.com/diomeca-font.html');
  assert.deepEqual(queueRow.download_urls, [
    { url: 'https://www.1001fonts.com/download/diomeca-font.zip', label: '1001fonts' },
  ]);
});
