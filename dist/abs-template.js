export var AbsTemplatePrintMethod;
(function (AbsTemplatePrintMethod) {
    AbsTemplatePrintMethod["BEFORE_BEGIN"] = "beforebegin";
    AbsTemplatePrintMethod["BEFORE_END"] = "beforeend";
    AbsTemplatePrintMethod["AFTER_BEGIN"] = "afterbegin";
    AbsTemplatePrintMethod["AFTER_END"] = "afterend";
})(AbsTemplatePrintMethod || (AbsTemplatePrintMethod = {}));
;
;
export class AbsTemplate {
    static build(config) {
        try {
            if (!Boolean(config.templateNode))
                throw `${this.CONSOLE_PREFIX} "templateNode" in config is null or undefined`;
            let templateNodeContentString = this.getContentFromTemplateNode(config.templateNode);
            const isDataDefined = !(config.templateData === undefined || config.templateData === null);
            if (isDataDefined) {
                templateNodeContentString = templateNodeContentString.replaceAll('\n', '');
                templateNodeContentString = this.parse(templateNodeContentString, config.templateData);
            }
            const parsedNode = this._utils.stringToNode(templateNodeContentString);
            this.print(Array.from(parsedNode.childNodes), config.printTargetNode, config.printMethod);
        }
        catch (error) {
            console.error(error);
        }
    }
    static print(node, target, method) {
        if (method === AbsTemplatePrintMethod.AFTER_BEGIN || method === AbsTemplatePrintMethod.AFTER_END) {
            node.reverse();
        }
        node.forEach(nodeItem => {
            nodeItem.nodeType !== Node.TEXT_NODE && target.insertAdjacentElement(method, nodeItem);
        });
    }
    static parseParameters(template, data, patternOverride) {
        const parameterPattern = new RegExp(patternOverride || this.PARAMETER_PATTERN, '');
        const matches = this.getParseMatches(template, patternOverride || this.PARAMETER_PATTERN);
        matches?.forEach(match => {
            const dataMatches = parameterPattern.exec(match);
            const key = dataMatches[1];
            const keyValue = data[key];
            if (keyValue || keyValue === '') {
                template = template.replace(match, keyValue);
            }
        });
        return template;
    }
    static parseConditions(template, data) {
        const conditionStatementPattern = new RegExp(this.CONDITION_STATEMENT_PATTERN, '');
        const conditionPattern = new RegExp(this.CONDITION_PATTERN, '');
        const matches = this.getParseMatches(template, this.CONDITION_STATEMENT_PATTERN);
        matches?.forEach(match => {
            const matchGroups = conditionStatementPattern.exec(match);
            const statementBlock = matchGroups[0];
            const condition = matchGroups[1];
            const parsedCondition = conditionPattern.exec(condition);
            const isConditionSingleParameter = !Boolean(parsedCondition);
            const positiveContent = matchGroups[2];
            const negativeContent = matchGroups[3];
            const printConditionResult = (conditionResult) => {
                if (Boolean(conditionResult)) {
                    template = template.replace(statementBlock, positiveContent);
                }
                else {
                    template = template.replace(statementBlock, negativeContent || '');
                }
            };
            if (isConditionSingleParameter) {
                const parameter = data[condition];
                printConditionResult(Boolean(parameter));
            }
            else {
                const sanitizeParameter = (parameter) => {
                    return (!Number.isNaN(parseFloat(parameter)) ? parseFloat(parameter) :
                        parameter === 'true' ? true :
                            parameter === 'false' ? false :
                                parameter === 'undefined' ? undefined :
                                    parameter === 'null' ? null :
                                        parameter);
                };
                const conditionMatchGroups = conditionPattern.exec(condition);
                const firstParameter = sanitizeParameter(conditionMatchGroups[1]);
                const operator = conditionMatchGroups[2];
                const secondParameter = sanitizeParameter(conditionMatchGroups[3]);
                let conditionResult = false;
                switch (operator) {
                    case '==':
                        conditionResult = Boolean(firstParameter == secondParameter);
                        break;
                    case '===':
                        conditionResult = Boolean(firstParameter === secondParameter);
                        break;
                    case '!=':
                        conditionResult = Boolean(firstParameter != secondParameter);
                        break;
                    case '!==':
                        conditionResult = Boolean(firstParameter !== secondParameter);
                        break;
                    case '>':
                        conditionResult = Boolean(firstParameter > secondParameter);
                        break;
                    case '>=':
                        conditionResult = Boolean(firstParameter >= secondParameter);
                        break;
                    case '&&':
                        conditionResult = Boolean(firstParameter && secondParameter);
                        break;
                    case '||':
                        conditionResult = Boolean(firstParameter || secondParameter);
                        break;
                    case '%':
                        conditionResult = Boolean(parseFloat(firstParameter) % parseFloat(secondParameter));
                        break;
                    case '^':
                        conditionResult = Boolean(parseFloat(firstParameter) ^ parseFloat(secondParameter));
                        break;
                }
                printConditionResult(conditionResult);
            }
        });
        return template;
    }
    static parseCycles(template, data) {
        const cycleStatementPattern = new RegExp(this.CYCLE_STATEMENT_PATTERN, '');
        const matches = this.getParseMatches(template, this.CYCLE_STATEMENT_PATTERN);
        matches?.forEach(match => {
            const matchGroups = cycleStatementPattern.exec(match);
            const itemKey = matchGroups[1];
            const listKey = matchGroups[2];
            const cycleContent = matchGroups[3];
            const templateData = data;
            if (templateData) {
                const list = templateData[listKey];
                let res = '';
                if (!Array.isArray(list))
                    throw `${this.CONSOLE_PREFIX} Template contains a "forEach" with a parameter that cannot be iterated.`;
                list.forEach(listItem => {
                    const subParamRegex = new RegExp(`\\\{\\\{${itemKey}\\.(.+?)\\\}\\\}`, 'g');
                    res += this.parseParameters(cycleContent, listItem, subParamRegex);
                });
                template = template.replace(match, res);
            }
        });
        return template;
    }
    static parse(template, data) {
        template = this.parseConditions(template, data);
        template = this.parseCycles(template, data);
        template = this.parseParameters(template, data);
        return template;
    }
    static compile(template, data) {
        return this.parse(template, data);
    }
}
AbsTemplate.CONSOLE_PREFIX = '[ABS][TEMPLATE]';
AbsTemplate.PARAMETER_PATTERN = /\{\{(.+?)\}\}/;
AbsTemplate.CONDITION_STATEMENT_PATTERN = /\{\{if (.+?)\}\}(.+?)(?:\{\{else\}\}(.+?))?\{\{\/if\}\}/;
AbsTemplate.CONDITION_PATTERN = /(.+) (==|===|!=|!==|>|>=|<|<=|&&|\|\||%|\^) (.+)/;
AbsTemplate.CYCLE_STATEMENT_PATTERN = /\{\{forEach (.+?) in (.+?)\}\}(.+?)\{\{\/forEach\}\}/;
AbsTemplate.getContentFromTemplateNode = (templateNode) => {
    const templateNodeContent = templateNode.innerHTML;
    const domParser = new DOMParser();
    const parsedDocument = domParser.parseFromString(templateNodeContent, 'text/html');
    const parsedDocumentBodyNode = parsedDocument.querySelector('body');
    return parsedDocumentBodyNode.innerHTML;
};
AbsTemplate.getParseMatches = (template, pattern) => {
    const parameterGlobalPattern = new RegExp(pattern, 'g');
    const matches = template.match(parameterGlobalPattern);
    return matches;
};
AbsTemplate._utils = {
    nodeToString: (node) => {
        return node.outerHTML.replaceAll('\n', '');
    },
    stringToNode: (node) => {
        const resultNode = document.createElement('div');
        resultNode.innerHTML = node;
        return resultNode;
    },
    removeCharacterFromString: (string, characterIndex) => {
        return string.substring(0, characterIndex) + string.substring(characterIndex + 1, string.length);
    }
};
//# sourceMappingURL=abs-template.js.map