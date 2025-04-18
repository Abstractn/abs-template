export declare enum AbsTemplatePrintMethod {
  BEFORE_BEGIN = "beforebegin",
  BEFORE_END = "beforeend",
  AFTER_BEGIN = "afterbegin",
  AFTER_END = "afterend"
}
export declare enum AbsTemplateBracketType {
  CURLY = "curly",
  SQUARE = "square"
}
export type AbsTemplateData = Record<string, string> | Object | any[];
export interface AbsTemplateBuildConfig {
  templateNode: HTMLTemplateElement | HTMLElement;
  templateData?: AbsTemplateData;
  printTargetNode: HTMLElement;
  printMethod: AbsTemplatePrintMethod;
  bracketType?: AbsTemplateBracketType;
}
export declare class AbsTemplate {
  private static readonly CONSOLE_PREFIX;
  private static readonly CONDITION_PATTERN_STRING;
  private static getPatterns;
  static build(config: AbsTemplateBuildConfig): void;
  private static getContentFromTemplateNode;
  private static print;
  private static parseValue;
  private static parseCondition;
  private static parseCycle;
  private static parse;
  static compile(template: string, data: AbsTemplateData, bracketType?: AbsTemplateBracketType): string;
  private static _utils;
}