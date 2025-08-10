// Basic d3 v2/v3 type declarations for pytutor.ts
declare namespace d3 {
  interface Map<T> {
    forEach(func: (key: string, value: T) => void): void;
    set(key: string, value: T): Map<T>;
    get(key: string): T | undefined;
    has(key: string): boolean;
    remove(key: string): boolean;
    keys(): string[];
    values(): T[];
    entries(): Array<{ key: string; value: T }>;
    size(): number;
    empty(): boolean;
  }

  interface Selection<T = any> {
    select(selector: string): Selection<T>;
    selectAll(selector: string): Selection<T>;
    attr(name: string, value?: any): Selection<T>;
    style(name: string, value?: any): Selection<T>;
    classed(name: string, value?: boolean): Selection<T>;
    text(value?: string): Selection<T>;
    html(value?: string): Selection<T>;
    append(name: string): Selection<T>;
    remove(): Selection<T>;
    data(data?: any[]): Selection<T>;
    enter(): Selection<T>;
    exit(): Selection<T>;
    on(event: string, listener?: (d?: any, i?: number) => void): Selection<T>;
    each(func: (d: any, i: number) => void): Selection<T>;
    node(): Element | null;
    empty(): boolean;
    size(): number;
  }

  function select(selector: string | Element): Selection;
  function selectAll(selector: string): Selection;
  function map<T>(): Map<T>;
}

declare var d3: typeof d3;
