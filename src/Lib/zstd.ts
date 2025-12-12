//zstd_.jsをGPTにTSにさせたもの
// zstd.ts

const DEFAULT_LEVEL = 3;

async function loadWasmModule(): Promise<any> {
	// @ts-ignore
	const factory = (await import("./_zstd_internal.js")).default;
	const result = await factory({});
	return result && typeof result.then === "function" ? await result : result;
}

export interface ZstdAPI {
	Module: any;
	// @ts-ignore
	Compresser: typeof ZstdCompresser;
	// @ts-ignore
	Decompresser: typeof ZstdDecompresser;
}

function makeZstdAPI(module: any): ZstdAPI {
	const HEAPU8: Uint8Array = module.HEAPU8;
	const HEAPU32: Uint32Array = module.HEAPU32;

	const zstdCStreamCreate = module._zstd_cstream_create as (level: number) => number;
	const zstdCStreamFree = module._zstd_cstream_free as (ctx: number) => void;
	const zstdCStreamInSize = module._zstd_cstream_in_size as () => number;
	const zstdCStreamOutSize = module._zstd_cstream_out_size as () => number;
	const zstdCStreamProcess = module._zstd_cstream_process as (
		ctx: number,
		inPtr: number,
		inSize: number,
		outPtr: number,
		outCapacity: number,
		consumedPtr: number,
		isEnd: number
	) => number;

	const zstdDStreamCreate = module._zstd_dstream_create as () => number;
	const zstdDStreamFree = module._zstd_dstream_free as (ctx: number) => void;
	const zstdDStreamInSize = module._zstd_dstream_in_size as () => number;
	const zstdDStreamOutSize = module._zstd_dstream_out_size as () => number;
	const zstdDStreamProcess = module._zstd_dstream_process as (
		ctx: number,
		inPtr: number,
		inSize: number,
		outPtr: number,
		outCapacity: number,
		consumedPtr: number
	) => number;

	function checkError(ret: number): void {
		if (ret < 0) {
			const code = (-ret) >>> 0;
			throw new Error(`Zstd error: code=${code}`);
		}
	}

	function ensureUint8Array(chunk: Uint8Array | ArrayBuffer | ArrayBufferView): Uint8Array {
		if (chunk instanceof Uint8Array) return chunk;
		if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
		if (ArrayBuffer.isView(chunk))
			return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
		throw new TypeError("chunk must be Uint8Array/ArrayBuffer/View");
	}

	class ZstdCompresser {
		module: any;
		level: number;
		ctx: number;
		inChunkSize: number;
		outChunkSize: number;

		inPtr: number;
		outPtr: number;
		consumedPtr: number;

		transform: TransformStream<Uint8Array, Uint8Array>;

		constructor(level: number = DEFAULT_LEVEL) {
			this.level = level | 0;
			this.module = module;
			this.ctx = zstdCStreamCreate(this.level);
			if (!this.ctx) throw new Error("zstd_cstream_create failed");

			this.inChunkSize = zstdCStreamInSize();
			this.outChunkSize = zstdCStreamOutSize();

			this.inPtr = this.module._malloc(this.inChunkSize);
			this.outPtr = this.module._malloc(this.outChunkSize);
			this.consumedPtr = this.module._malloc(4);

			const self = this;
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

		free(): void {
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

		private async handleChunk(
			chunk: Uint8Array | ArrayBuffer | ArrayBufferView,
			controller: TransformStreamDefaultController<Uint8Array>,
			isEnd: boolean
		): Promise<void> {
			if (!this.ctx) throw new Error("ZstdCompresser already closed");

			const input = ensureUint8Array(chunk);
			let offset = 0;

			while (offset < input.length) {
				const remaining = input.length - offset;
				const toCopy = Math.min(remaining, this.inChunkSize);

				if (toCopy > 0) {
					HEAPU8.set(input.subarray(offset, offset + toCopy), this.inPtr);
				}

				const ret = zstdCStreamProcess(
					this.ctx,
					this.inPtr,
					toCopy,
					this.outPtr,
					this.outChunkSize,
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

		get readable(): ReadableStream<Uint8Array> {
			return this.transform.readable;
		}

		get writable(): WritableStream<Uint8Array> {
			return this.transform.writable;
		}
	}

	class ZstdDecompresser {
		module: any;

		ctx: number;
		inChunkSize: number;
		outChunkSize: number;

		inPtr: number;
		outPtr: number;
		consumedPtr: number;

		transform: TransformStream<Uint8Array, Uint8Array>;

		constructor() {
			this.module = module;
			this.ctx = zstdDStreamCreate();
			if (!this.ctx) throw new Error("zstd_dstream_create failed");

			this.inChunkSize = zstdDStreamInSize();
			this.outChunkSize = zstdDStreamOutSize();

			this.inPtr = this.module._malloc(this.inChunkSize);
			this.outPtr = this.module._malloc(this.outChunkSize);
			this.consumedPtr = this.module._malloc(4);

			const self = this;
			this.transform = new TransformStream({
				async transform(chunk, controller) {
					await self.handleChunk(chunk, controller);
				},
				async flush() {
					self.free();
				},
			});
		}

		free(): void {
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

		private async handleChunk(
			chunk: Uint8Array | ArrayBuffer | ArrayBufferView,
			controller: TransformStreamDefaultController<Uint8Array>
		): Promise<void> {
			if (!this.ctx) throw new Error("ZstdDecompresser already closed");

			const input = ensureUint8Array(chunk);
			let offset = 0;

			while (offset < input.length) {
				const toCopy = Math.min(input.length - offset, this.inChunkSize);

				if (toCopy > 0) {
					HEAPU8.set(input.subarray(offset, offset + toCopy), this.inPtr);
				}

				const ret = zstdDStreamProcess(
					this.ctx,
					this.inPtr,
					toCopy,
					this.outPtr,
					this.outChunkSize,
					this.consumedPtr
				);
				checkError(ret);

				const produced = ret | 0;

				if (produced > 0) {
					const view = HEAPU8.subarray(this.outPtr, this.outPtr + produced);
					controller.enqueue(new Uint8Array(view));
				}

				offset += toCopy;
			}
		}

		get readable(): ReadableStream<Uint8Array> {
			return this.transform.readable;
		}

		get writable(): WritableStream<Uint8Array> {
			return this.transform.writable;
		}
	}

	return {
		Module: module,
		Compresser: ZstdCompresser,
		Decompresser: ZstdDecompresser,
	};
}

export default async function zstd_init(): Promise<ZstdAPI> {
	return makeZstdAPI(await loadWasmModule());
}
