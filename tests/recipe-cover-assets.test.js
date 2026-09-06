import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function webpDimensions(bytes, filename) {
  assert.ok(bytes.length >= 20, `${filename}: WebP file is too small.`);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${filename}: missing RIFF signature.`);
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${filename}: missing WEBP signature.`);

  const declaredLength = bytes.readUInt32LE(4) + 8;
  assert.equal(
    bytes.length,
    declaredLength,
    `${filename}: truncated or overlong RIFF container (actual ${bytes.length} B, declared ${declaredLength} B).`
  );

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const fourcc = bytes.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + chunkSize;

    assert.ok(dataEnd <= bytes.length, `${filename}: ${fourcc} chunk exceeds file length.`);

    if (fourcc === 'VP8X') {
      assert.ok(chunkSize >= 10, `${filename}: invalid VP8X chunk.`);
      return {
        width: readUint24LE(bytes, dataOffset + 4) + 1,
        height: readUint24LE(bytes, dataOffset + 7) + 1
      };
    }

    if (fourcc === 'VP8 ') {
      assert.ok(chunkSize >= 10, `${filename}: invalid VP8 chunk.`);
      assert.equal(bytes[dataOffset + 3], 0x9d, `${filename}: invalid VP8 frame start code.`);
      assert.equal(bytes[dataOffset + 4], 0x01, `${filename}: invalid VP8 frame start code.`);
      assert.equal(bytes[dataOffset + 5], 0x2a, `${filename}: invalid VP8 frame start code.`);
      return {
        width: bytes.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: bytes.readUInt16LE(dataOffset + 8) & 0x3fff
      };
    }

    if (fourcc === 'VP8L') {
      assert.ok(chunkSize >= 5, `${filename}: invalid VP8L chunk.`);
      assert.equal(bytes[dataOffset], 0x2f, `${filename}: invalid VP8L signature.`);
      const b1 = bytes[dataOffset + 1];
      const b2 = bytes[dataOffset + 2];
      const b3 = bytes[dataOffset + 3];
      const b4 = bytes[dataOffset + 4];
      return {
        width: 1 + b1 + ((b2 & 0x3f) << 8),
        height: 1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10)
      };
    }

    offset = dataEnd + (chunkSize % 2);
  }

  assert.fail(`${filename}: no decodable VP8/VP8L/VP8X image chunk found.`);
}

test('every recipe manifest cover is a complete local WebP container', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'recipes/index.json'), 'utf8'));
  assert.ok(manifest.recipes.length > 0, 'Recipe manifest must expose at least one recipe.');

  const seen = new Set();
  const failures = [];

  for (const recipe of manifest.recipes) {
    try {
      const imageUrl = recipe.visual?.imageUrl;
      assert.match(imageUrl ?? '', /^\.\/assets\/recipes\/[a-z0-9-]+\.webp$/, `${recipe.id}: cover must be a local WebP asset.`);
      assert.equal(seen.has(imageUrl), false, `${recipe.id}: duplicate cover path ${imageUrl}.`);
      seen.add(imageUrl);

      const relativePath = imageUrl.slice(2);
      const bytes = await readFile(path.join(root, relativePath));
      const dimensions = webpDimensions(bytes, relativePath);
      assert.ok(dimensions.width > 0 && dimensions.height > 0, `${relativePath}: invalid image dimensions.`);
    } catch (error) {
      failures.push(`${recipe.id}: ${error.message}`);
    }
  }

  assert.deepEqual(failures, [], `Invalid recipe covers:\n${failures.join('\n')}`);
});
