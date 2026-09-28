declare module 'gifenc' {
  export interface GIFEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  export interface WriteFrameOptions {
    palette?: number[][];
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame: (index: Uint8Array | number[], width: number, height: number, opts?: WriteFrameOptions) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
    stream: any;
    reset: () => void;
  }

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance;
  export function quantize(data: Uint8ClampedArray | Uint8Array | number[], maxColors: number, options?: any): number[][];
  export function applyPalette(data: Uint8ClampedArray | Uint8Array | number[], palette: number[][], format?: string): Uint8Array;
}
