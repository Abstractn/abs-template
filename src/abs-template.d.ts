export declare enum AbsTemplatePrintMethod {
  BEFORE_BEGIN = "beforebegin",
  BEFORE_END = "beforeend",
  AFTER_BEGIN = "afterbegin",
  AFTER_END = "afterend"
}
export type AbsTemplateData = Record<string, string> | Object | any[];
export interface AbsTemplateBuildConfig {
  templateNode: HTMLTemplateElement | HTMLElement;
  templateData?: AbsTemplateData;
  printTargetNode: HTMLElement;
  printMethod: AbsTemplatePrintMethod;
}
export declare class AbsTemplate {
  private static readonly CONSOLE_PREFIX;
  private static readonly PARAMETER_PATTERN;
  private static readonly CONDITION_STATEMENT_PATTERN;
  private static readonly CONDITION_PATTERN;
  private static readonly CYCLE_STATEMENT_PATTERN;
  static build(config: AbsTemplateBuildConfig): void;
  private static getContentFromTemplateNode;
  private static print;
  private static getParseMatches;
  private static parseParameters;
  private static parseConditions;
  private static parseCycles;
  private static parse;
  static compile(template: string, data: AbsTemplateData): string;
  private static _utils;
}