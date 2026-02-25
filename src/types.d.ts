// Type declarations for external modules
declare module 'node-nlp';
declare module 'kuroshiro';
declare module 'kuroshiro-analyzer-kuromoji';
declare module 'pinyin';

// Global declarations
declare global {
  var mongoose: {
    conn: any | null;
    promise: Promise<any> | null;
  };
}
