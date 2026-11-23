// Type declarations for xlsx-populate
declare module 'xlsx-populate' {
  export interface Style {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean | 'single' | 'double';
    strikethrough?: boolean;
    fontSize?: number;
    fontFamily?: string;
    fontColor?: string;
    fill?: string | { type: string; color: string };
    border?: boolean | string | {
      top?: { style: string; color: string };
      bottom?: { style: string; color: string };
      left?: { style: string; color: string };
      right?: { style: string; color: string };
    };
    alignment?: {
      horizontal?: 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous';
      vertical?: 'top' | 'center' | 'bottom' | 'justify' | 'distributed';
      wrapText?: boolean;
      indent?: number;
      textRotation?: number;
    };
    numberFormat?: string;
  }

  export interface Cell {
    value(): any;
    value(value: any): this;
    style(): Style | undefined;
    style(style: Style): this;
    formula(): string;
    formula(formula: string): this;
    date(): Date | null;
    date(date: Date): this;
    hyperlink(): string;
    hyperlink(url: string): this;
    merge(allowOverlap?: boolean): this;
    unmerge(): this;
    merged(): boolean;
    rowNumber(): number;
    columnNumber(): number;
    address(): string;
    sheet(): Sheet;
    richText(richText: RichText): this;
  }

  export interface Range {
    startCell(): Cell;
    endCell(): Cell;
    value(): any[][];
    value(values: any[][]): this;
    style(style: Style): this;
    style(): Style | undefined;
    forEach(callback: (cell: Cell, row: number, col: number) => void): this;
    merge(): this;
    unmerge(): this;
  }

  export interface Sheet {
    name(): string;
    name(name: string): this;
    cell(rowOrRef: number | string, col?: number): Cell;
    usedRange(): Range | null;
    range(startRow: number, startCol: number, endRow: number, endCol: number): Range;
    range(address: string): Range;
    column(column: number | string): Range;
    row(row: number): Range;
    addSheet(name: string): Sheet;
    deleteSheet(name: string): this;
    sheets(): Sheet[];
    sheet(name: string): Sheet;
    workbook(): Workbook;
    printGridlines(): boolean;
    printGridlines(value: boolean): this;
    showGridlines(): boolean;
    showGridlines(value: boolean): this;
  }

  export interface Workbook {
    sheet(name: string): Sheet;
    sheets(): Sheet[];
    addSheet(name: string): Sheet;
    deleteSheet(name: string): this;
    outputAsync(type: 'buffer' | 'arraybuffer' | 'base64' | 'blob' | 'nodebuffer'): Promise<any>;
    fileAsync(path: string): Promise<void>;
  }

  export interface RichText {
    addRun(text: string, style?: Style): this;
    toString(): string;
  }

  export const MIME_TYPE: string;
  export const FormulaError: any;
  export const RichText: new () => RichText;

  export function fromFileAsync(path: string): Promise<Workbook>;
  export function fromDataAsync(data: ArrayBuffer | Buffer | Uint8Array, options?: { password?: string }): Promise<Workbook>;
  export function fromBlankAsync(): Promise<Workbook>;

  export default {
    fromFileAsync,
    fromDataAsync,
    fromBlankAsync,
    MIME_TYPE,
    FormulaError,
    RichText,
  };
}