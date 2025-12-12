// Usage:
//   import zstd_init from './zstd.js';
//   const zstd = await zstd_init();
//   const compressed = inputRS.pipeThrough(new zstd.Compresser(3));
//   const ds = new zstd.Decompresser();
//   const decompressed = blob.stream().pipeThrough(ds);

/** @type {number} default compression level */
const DEFAULT_LEVEL = 3;

/**
 * @returns {Promise<any>}
 */
async function loadWasmModule() {
  const factory = (await import("./_zstd_internal.js")).default;
  const result = await factory({});

  /** @type {any} */
  const mod =
    result && typeof result.then === "function" ? await result : result;
  return mod;
}

/**
 * @param {any} module Emscripten Module
 * @returns {{ Module: any, Compresser: ZstdCompresser, Decompresser: ZstdDecompresser }}
 */
function makeZstdAPI(module) {
  const HEAPU8 = module.HEAPU8;
  const HEAPU32 = module.HEAPU32;

  const zstdCStreamCreate = module._zstd_cstream_create;
  const zstdCStreamFree = module._zstd_cstream_free;
  const zstdCStreamInSize = module._zstd_cstream_in_size;
  const zstdCStreamOutSize = module._zstd_cstream_out_size;
  const zstdCStreamProcess = module._zstd_cstream_process;

  const zstdDStreamCreate = module._zstd_dstream_create;
  const zstdDStreamFree = module._zstd_dstream_free;
  const zstdDStreamInSize = module._zstd_dstream_in_size;
  const zstdDStreamOutSize = module._zstd_dstream_out_size;
  const zstdDStreamProcess = module._zstd_dstream_process;

  /**
   * @param {number} ret
   * @throws {Error}
   */
  function checkError(ret) {
    if (ret < 0) {
      const code = -ret >>> 0;
      throw new Error("Zstd error: code=" + code);
    }
  }

  /**
   * @param {Uint8Array|ArrayBuffer|ArrayBufferView} chunk
   * @returns {Uint8Array}
   */
  function ensureUint8Array(chunk) {
    if (chunk instanceof Uint8Array) return chunk;
    if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
    if (ArrayBuffer.isView(chunk))
      return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    throw new TypeError("chunk must be Uint8Array/ArrayBuffer/View");
  }

  class ZstdCompresser {
    /**
     * @param {number} [level]
     */
    constructor(level = DEFAULT_LEVEL) {
      /** @type {number} */
      this.level = level | 0;
      /** @type {any} */
      this.module = module;
      /** @type {number} */
      this.ctx = zstdCStreamCreate(this.level);
      if (!this.ctx) throw new Error("zstd_cstream_create failed");

      /** @type {number} */
      this.inChunkSize = zstdCStreamInSize();
      /** @type {number} */
      this.outChunkSize = zstdCStreamOutSize();

      /** @type {number} */
      this.inPtr = this.module._malloc(this.inChunkSize);
      /** @type {number} */
      this.outPtr = this.module._malloc(this.outChunkSize);
      /** @type {number} */
      this.consumedPtr = this.module._malloc(4);

      const self = /** @type {ZstdCompresser} */ (this);
      /** @type {TransformStream<Uint8Array, Uint8Array>} */
      this.transform = new TransformStream({
        async transform(chunk, controller) {
          await self.handleChunk(chunk, controller, false);
        },
        async flush(controller) {
          await self.handleChunk(new Uint8Array(0), controller, true);
          self.free();
        },
      });
    }

    free() {
      if (this.ctx) {
        zstdCStreamFree(this.ctx);
        this.ctx = 0;
      }
      if (this.inPtr) {
        this.module._free(this.inPtr);
        this.inPtr = 0;
      }
      if (this.outPtr) {
        this.module._free(this.outPtr);
        this.outPtr = 0;
      }
      if (this.consumedPtr) {
        this.module._free(this.consumedPtr);
        this.consumedPtr = 0;
      }
    }

    /**
     * @param {Uint8Array|ArrayBuffer|ArrayBufferView} chunk
     * @param {TransformStreamDefaultController<Uint8Array>} controller
     * @param {boolean} isEnd
     */
    async handleChunk(chunk, controller, isEnd) {
      if (!this.ctx) throw new Error("ZstdCompresser already closed");

      const input = ensureUint8Array(chunk);
      let offset = 0;

      while (offset < input.length) {
        const remaining = input.length - offset;
        const toCopy = Math.min(remaining, this.inChunkSize);

        if (toCopy > 0) {
          HEAPU8.set(input.subarray(offset, offset + toCopy), this.inPtr);
        }

        const srcSize = toCopy;
        const dstCapacity = this.outChunkSize;

        const ret = zstdCStreamProcess(
          this.ctx,
          this.inPtr,
          srcSize,
          this.outPtr,
          dstCapacity,
          this.consumedPtr,
          0
        );
        checkError(ret);

        const produced = ret | 0;
        const consumed = HEAPU32[this.consumedPtr >> 2] >>> 0;

        if (produced > 0) {
          const view = HEAPU8.subarray(this.outPtr, this.outPtr + produced);
          controller.enqueue(new Uint8Array(view));
        }

        offset += consumed;
        if (consumed === 0) break;
      }

      if (isEnd) {
        const ret = zstdCStreamProcess(
          this.ctx,
          this.inPtr,
          0,
          this.outPtr,
          this.outChunkSize,
          this.consumedPtr,
          1
        );
        checkError(ret);

        const produced = ret | 0;
        if (produced > 0) {
          const view = HEAPU8.subarray(this.outPtr, this.outPtr + produced);
          controller.enqueue(new Uint8Array(view));
        }
      }
    }

    /** @returns {ReadableStream<Uint8Array>} */
    get readable() {
      return this.transform.readable;
    }

    /** @returns {WritableStream<Uint8Array>} */
    get writable() {
      return this.transform.writable;
    }
  }

  class ZstdDecompresser {
    constructor() {
      /** @type {any} */
      this.module = module;
      /** @type {number} */
      this.ctx = zstdDStreamCreate();
      if (!this.ctx) throw new Error("zstd_dstream_create failed");

      /** @type {number} */
      this.inChunkSize = zstdDStreamInSize();
      /** @type {number} */
      this.outChunkSize = zstdDStreamOutSize();

      /** @type {number} */
      this.inPtr = this.module._malloc(this.inChunkSize);
      /** @type {number} */
      this.outPtr = this.module._malloc(this.outChunkSize);
      /** @type {number} */
      this.consumedPtr = this.module._malloc(4);

      const self = /** @type {ZstdDecompresser} */ (this);
      /** @type {TransformStream<Uint8Array, Uint8Array>} */
      this.transform = new TransformStream({
        async transform(chunk, controller) {
          await self.handleChunk(chunk, controller);
        },
        async flush() {
          self.free();
        },
      });
    }

    free() {
      if (this.ctx) {
        zstdDStreamFree(this.ctx);
        this.ctx = 0;
      }
      if (this.inPtr) {
        this.module._free(this.inPtr);
        this.inPtr = 0;
      }
      if (this.outPtr) {
        this.module._free(this.outPtr);
        this.outPtr = 0;
      }
      if (this.consumedPtr) {
        this.module._free(this.consumedPtr);
        this.consumedPtr = 0;
      }
    }

    /**
     * @param {Uint8Array|ArrayBuffer|ArrayBufferView} chunk
     * @param {TransformStreamDefaultController<Uint8Array>} controller
     */
    async handleChunk(chunk, controller) {
      if (!this.ctx) throw new Error("ZstdDecompresser already closed");

      const input = ensureUint8Array(chunk);
      let offset = 0;
      while (offset < input.length) {
        const remaining = input.length - offset;
        const toCopy = Math.min(remaining, this.inChunkSize);

        if (toCopy > 0) {
          HEAPU8.set(input.subarray(offset, offset + toCopy), this.inPtr);
        }

        const srcSize = toCopy;
        const dstCapacity = this.outChunkSize;

        const ret = zstdDStreamProcess(
          this.ctx,
          this.inPtr,
          srcSize,
          this.outPtr,
          dstCapacity,
          this.consumedPtr
        );
        checkError(ret);

        const produced = ret | 0;

        if (produced > 0) {
          const view = HEAPU8.subarray(this.outPtr, this.outPtr + produced);
          controller.enqueue(new Uint8Array(view));
        }

        offset += srcSize;
      }
    }

    /** @returns {ReadableStream<Uint8Array>} */
    get readable() {
      return this.transform.readable;
    }

    /** @returns {WritableStream<Uint8Array>} */
    get writable() {
      return this.transform.writable;
    }
  }

  return {
    Module: module,
    Compresser: ZstdCompresser,
    Decompresser: ZstdDecompresser,
  };
}

/**
 * @example
 * const zstd = await zstd_init();
 * const compressed = inputRS.pipeThrough(new zstd.Compresser(3));
 *
 * @returns {Promise<{ Module: any, Compresser: ZstdCompresser, Decompresser: ZstdDecompresser }>}
 */
export default async function zstd_init() {
  return makeZstdAPI(await loadWasmModule());
}
