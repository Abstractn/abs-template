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
  private static readonly VALUE_STATEMENT_OPEN;
  private static readonly VALUE_PATTERN_STRING;
  private static readonly CONDITION_STATEMENT_OPEN;
  private static readonly CONDITION_STATEMENT_PATTERN_STRING;
  private static readonly CONDITION_PATTERN_STRING;
  private static readonly CONDITION_STATEMENT_CLOSE;
  private static readonly CYCLE_STATEMENT_OPEN;
  private static readonly CYCLE_STATEMENT_PATTERN_STRING;
  private static readonly CYCLE_STATEMENT_CLOSE;
  static build(config: AbsTemplateBuildConfig): void;
  private static getContentFromTemplateNode;
  private static print;
  private static parseValue;
  private static parseCondition;
  private static parseCycle;
  private static parse;
  static compile(template: string, data: AbsTemplateData): string;
  private static _utils;
}