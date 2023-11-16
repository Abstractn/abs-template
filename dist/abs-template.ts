export enum AbsTemplatePrintMethod {
  BEFORE_BEGIN = 'beforebegin',
  BEFORE_END = 'beforeend',
  AFTER_BEGIN = 'afterbegin',
  AFTER_END = 'afterend',
};

export type AbsTemplateData = Record<string, string> | Object | any[];

export interface AbsTemplateBuildConfig {
  templateNode: HTMLTemplateElement | HTMLElement;
  templateData?: AbsTemplateData;
  printTargetNode: HTMLElement;
  printMethod: AbsTemplatePrintMethod;
};

export class AbsTemplate {
  private static readonly CONSOLE_PREFIX: string = '[ABS][TEMPLATE]';
  private static readonly PARAMETER_PATTERN: RegExp = /\{\{(.+?)\}\}/;
  private static readonly CONDITION_STATEMENT_PATTERN: RegExp = /\{\{if (.+?)\}\}(.+?)(?:\{\{else\}\}(.+?))?\{\{\/if\}\}/;
  private static readonly CONDITION_PATTERN: RegExp = /(.+) (==|===|!=|!==|>|>=|<|<=|&&|\|\||%|\^) (.+)/;
  private static readonly CYCLE_STATEMENT_PATTERN: RegExp = /\{\{forEach (.+?) in (.+?)\}\}(.+?)\{\{\/forEach\}\}/;
  
  public static build(config: AbsTemplateBuildConfig): void {
    try {
      if(!Boolean(config.templateNode)) throw  `${this.CONSOLE_PREFIX} "templateNode" in config is null or undefined`;
      let templateNodeContentString = this.getContentFromTemplateNode(config.templateNode);

      const isDataDefined = !(config.templateData === undefined || config.templateData === null);
      if(isDataDefined) {
        templateNodeContentString = templateNodeContentString.replaceAll('\n', '');
        templateNodeContentString = this.parse(templateNodeContentString, config.templateData as AbsTemplateData);
      }

      const parsedNode = this._utils.stringToNode(templateNodeContentString);
      this.print((Array.from(parsedNode.childNodes) as HTMLElement[]), config.printTargetNode, config.printMethod);
    } catch (error) {
      console.error(error);
    }
  }

  private static getContentFromTemplateNode = (templateNode: HTMLTemplateElement | HTMLElement): string => {
    const templateNodeContent = templateNode.innerHTML;
    const domParser = new DOMParser();
    const parsedDocument = domParser.parseFromString(templateNodeContent as string, 'text/html');
    const parsedDocumentBodyNode = parsedDocument.querySelector('body') as HTMLElement;
    return parsedDocumentBodyNode.innerHTML;
  }

  private static print(node: HTMLElement[], target: HTMLElement, method: AbsTemplatePrintMethod): void {
    if(method === AbsTemplatePrintMethod.AFTER_BEGIN || method === AbsTemplatePrintMethod.AFTER_END) {
      node.reverse();
    }
    node.forEach(nodeItem => {
      nodeItem.nodeType !== Node.TEXT_NODE && target.insertAdjacentElement(method, nodeItem);
    });
  }

  private static getParseMatches = (template: string, pattern: RegExp): RegExpMatchArray | null => {
    const parameterGlobalPattern = new RegExp(pattern, 'g');
    const matches = template.match(parameterGlobalPattern);
    return matches;
  }

  private static parseParameters(template: string, data: AbsTemplateData, patternOverride?: RegExp): string {
    const parameterPattern = new RegExp(patternOverride || this.PARAMETER_PATTERN, '');
    const matches = this.getParseMatches(template, patternOverride || this.PARAMETER_PATTERN);
    matches?.forEach(match => {
      const dataMatches = parameterPattern.exec(match) as Array<string>;
      const key = dataMatches[1];
      const keyValue = (data as Record<string, string>)[key];
      if(keyValue || keyValue === '') {
        template = template.replace(match, keyValue);
      }
    });
    return template;
  }

  private static parseConditions(template: string, data: AbsTemplateData): string {
    //BUG if there are multiple statements of the same type inside each other
    //the first level will probably match very first closing pattern found (the inner-most statement)
    //and the result is overlapped
    //FIXME run a `this.parse()` before anything else
    //by passing the `conditionContent` of the current match as restricted `template` parameter
    //as this will work recursively by finding the inner-most level
    //and leave only the correct closing pattern as last one
    const conditionStatementPattern = new RegExp(this.CONDITION_STATEMENT_PATTERN, '');
    const conditionPattern = new RegExp(this.CONDITION_PATTERN, '');
    const matches = this.getParseMatches(template, this.CONDITION_STATEMENT_PATTERN);
    matches?.forEach(match => {
      const matchGroups = conditionStatementPattern.exec(match) as Array<string>;
      const statementBlock: string = matchGroups[0];
      const condition: string = matchGroups[1];
      const parsedCondition: Array<string>|undefined = conditionPattern.exec(condition) as Array<string>;
      const isConditionSingleParameter = !Boolean(parsedCondition);
      const positiveContent: string = matchGroups[2];
      const negativeContent: string|undefined = matchGroups[3];
      const printConditionResult = (conditionResult: boolean): void => {
        if(Boolean(conditionResult)) {
          template = template.replace(statementBlock, positiveContent);
        } else {
          template = template.replace(statementBlock, negativeContent || '');
        }
      };
      if(isConditionSingleParameter) {
        const parameter = (data as Record<string,string>)[condition];
        printConditionResult(Boolean(parameter));
      } else {
        const sanitizeParameter = (parameter: string): boolean|null|undefined|string|number => {
          return (
            !Number.isNaN(parseFloat(parameter)) ? parseFloat(parameter) :
            parameter === 'true' ? true :
            parameter === 'false' ? false :
            parameter === 'undefined' ? undefined :
            parameter === 'null' ? null :
            parameter
          );
        };
        const conditionMatchGroups = conditionPattern.exec(condition) as Array<string>;
        const firstParameter = sanitizeParameter(conditionMatchGroups[1]);
        const operator = conditionMatchGroups[2];
        const secondParameter = sanitizeParameter(conditionMatchGroups[3]);
        let conditionResult: boolean = false;
        switch(operator) {
          case '==':  conditionResult = Boolean((firstParameter as any) ==  (secondParameter as any)); break;
          case '===': conditionResult = Boolean((firstParameter as any) === (secondParameter as any)); break;
          case '!=':  conditionResult = Boolean((firstParameter as any) !=  (secondParameter as any)); break;
          case '!==': conditionResult = Boolean((firstParameter as any) !== (secondParameter as any)); break;
          case '>':   conditionResult = Boolean((firstParameter as any) >   (secondParameter as any)); break;
          case '>=':  conditionResult = Boolean((firstParameter as any) >=  (secondParameter as any)); break;
          //case '<':   conditionResult = Boolean((firstParameter as any) <   (secondParameter as any)); break;
          //case '<=':  conditionResult = Boolean((firstParameter as any) <=  (secondParameter as any)); break;
          case '&&':  conditionResult = Boolean((firstParameter as any) &&  (secondParameter as any)); break;
          case '||':  conditionResult = Boolean((firstParameter as any) ||  (secondParameter as any)); break;
          case '%':   conditionResult = Boolean(parseFloat(firstParameter as string) % parseFloat(secondParameter as string)); break;
          case '^':   conditionResult = Boolean(parseFloat(firstParameter as string) ^ parseFloat(secondParameter as string)); break;
        }
        printConditionResult(conditionResult);
      }
    });
    return template;
  }

  private static parseCycles(template: string, data: AbsTemplateData): string {
    //BUG if there are multiple statements of the same type inside each other
    //the first level will probably match very first closing pattern found (the inner-most statement)
    //and the result is overlapped
    //FIXME run a `this.parse()` before anything else
    //by passing the `cycleContent` of the current match as restricted `template` parameter
    //as this will work recursively by finding the inner-most level
    //and leave only the correct closing pattern as last one
    const cycleStatementPattern = new RegExp(this.CYCLE_STATEMENT_PATTERN, '');
    const matches = this.getParseMatches(template, this.CYCLE_STATEMENT_PATTERN);
    matches?.forEach(match => {
      const matchGroups = cycleStatementPattern.exec(match) as Array<string>;
      const itemKey = matchGroups[1];
      const listKey = matchGroups[2];
      const cycleContent = matchGroups[3];

      const templateData = data as Record<string, string|Object|any[]>;
      if(templateData) {
        const list = templateData[listKey];
        let res = '';
        if(!Array.isArray(list)) throw `${this.CONSOLE_PREFIX} Template contains a "forEach" with a parameter that cannot be iterated.`;
        list.forEach(listItem => {
          //BUG same case for statements inside each other
          //an `${itemKey}.(...listItem)` could be found not wrapped by standard curly brackets pattern
          const subParamRegex = new RegExp(`\\\{\\\{${itemKey}\\.(.+?)\\\}\\\}`,'g');
          res += this.parseParameters(cycleContent, listItem, subParamRegex);
        });
        template = template.replace(match, res);
      }
    });
    return template;
  }

  private static parse(template: string, data: AbsTemplateData): string {
    template = this.parseConditions(template, data);
    template = this.parseCycles(template, data);
    template = this.parseParameters(template, data);
    return template;
  }

  public static compile(template: string, data: AbsTemplateData): string {
    return this.parse(template, data);
  }

  private static _utils = {
    nodeToString: (node: HTMLElement): string => {
      return node.outerHTML.replaceAll('\n', '');
    },
    stringToNode: (node: string): HTMLElement => {
      const resultNode = document.createElement('div');
      resultNode.innerHTML = node;
      return resultNode;

    },
    removeCharacterFromString: (string: string, characterIndex: number): string => {
      return string.substring(0, characterIndex) + string.substring(characterIndex + 1, string.length);
    }
  }
}