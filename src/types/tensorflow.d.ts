declare module '@tensorflow/tfjs-node' {
  export * from '@tensorflow/tfjs';
}

declare module '@tensorflow/tfjs' {
  export interface LayersModel {
    add(layer: any): void;
    compile(options: any): void;
    predict(input: any): any;
    fit(x: any, y: any, options?: any): Promise<any>;
    save(path: string): Promise<any>;
  }

  export namespace layers {
    function dense(options: any): any;
    function embedding(options: any): any;
    function flatten(options?: any): any;
  }

  export function sequential(): LayersModel;
  export function tensor(data: any[], shape?: number[]): any;
  export function tensor1d(data: any[]): any;
  export function tensor2d(data: any[], shape?: [number, number]): any;
}
