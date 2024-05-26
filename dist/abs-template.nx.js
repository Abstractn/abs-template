var _a;
var AbsTemplatePrintMethod;
(function (AbsTemplatePrintMethod) {
    AbsTemplatePrintMethod["BEFORE_BEGIN"] = "beforebegin";
    AbsTemplatePrintMethod["BEFORE_END"] = "beforeend";
    AbsTemplatePrintMethod["AFTER_BEGIN"] = "afterbegin";
    AbsTemplatePrintMethod["AFTER_END"] = "afterend";
})(AbsTemplatePrintMethod || (AbsTemplatePrintMethod = {}));
;
;
class AbsTemplate {
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
            nodeItem.nodeType === Node.TEXT_NODE && target.insertAdjacentText(method, nodeItem.nodeValue);
        });
    }
    static parseValue(template, data) {
        let compiledTemplate = '';
        const matches = template.match(new RegExp(this.VALUE_PATTERN_STRING));
        if (matches?.length) {
            const fullMatch = matches[0];
            const valueIdentifier = matches[1];
            const valueFromData = this._utils.getValueByPath(data, valueIdentifier);
            compiledTemplate = valueFromData !== undefined ? valueFromData : fullMatch;
        }
        return compiledTemplate;
    }
    static parseCondition(template, data) {
        const conditionStatementPattern = new RegExp(this.CONDITION_STATEMENT_PATTERN_STRING, '');
        const conditionPattern = new RegExp(this.CONDITION_PATTERN_STRING, '');
        let compiledTemplate = '';
        const statementMatches = template.match(conditionStatementPattern);
        if (statementMatches?.length) {
            const condition = statementMatches[1];
            const parsedCondition = conditionPattern.exec(condition);
            const isConditionImplicit = !Boolean(parsedCondition);
            const positiveContent = statementMatches[2];
            const negativeContent = statementMatches[3];
            if (isConditionImplicit) {
                const valueFromData = this._utils.getValueByPath(data, condition);
                const implicitCheck = Boolean(valueFromData);
                const parsedContent = this._utils.if.parseContentFromCondition(implicitCheck, data, positiveContent, negativeContent);
                compiledTemplate = parsedContent;
            }
            else if (parsedCondition?.length) {
                const firstSanitizedParameter = this._utils.if.sanitizeParameter(parsedCondition[1]);
                const firstParameter = (this._utils.if.isParameterLiteral(firstSanitizedParameter) ?
                    this._utils.if.fixStringLiteral(firstSanitizedParameter) :
                    this._utils.getValueByPath(data, firstSanitizedParameter));
                const secondSanitizedParameter = this._utils.if.sanitizeParameter(parsedCondition[3]);
                const secondParameter = (this._utils.if.isParameterLiteral(secondSanitizedParameter) ?
                    this._utils.if.fixStringLiteral(secondSanitizedParameter) :
                    this._utils.getValueByPath(data, secondSanitizedParameter));
                const operator = parsedCondition[2];
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
                const parsedContent = this._utils.if.parseContentFromCondition(conditionResult, data, positiveContent, negativeContent);
                compiledTemplate = parsedContent;
            }
        }
        return compiledTemplate;
    }
    static parseCycle(template, data) {
        let compiledTemplate = '';
        const matches = template.match(new RegExp(this.CYCLE_STATEMENT_PATTERN_STRING));
        if (matches) {
            const keyOfListIdentifier = matches[1];
            const listIdentifier = matches[2];
            const cycleContent = matches[3];
            if (data) {
                const list = this._utils.getValueByPath(data, listIdentifier);
                if (!Array.isArray(list))
                    throw `${this.CONSOLE_PREFIX} Parameter "${listIdentifier}" is not iterable.`;
                list.forEach(listItem => {
                    const iterationData = {
                        ...this._utils.deepCopy(data),
                        [keyOfListIdentifier]: listItem,
                    };
                    compiledTemplate += this.parse(cycleContent, iterationData);
                });
            }
        }
        return compiledTemplate;
    }
    static parse(template, data) {
        let isTagOpen = false;
        let tagOpenStack = 0;
        let currentClosingTag = '';
        let openTagIndex = -1;
        let closeTagIndex = -1;
        let compiledTemplate = '';
        for (let i = 0; i < template.length; i++) {
            const isConditionOpening = template.slice(i, i + this.CONDITION_STATEMENT_OPEN.length) === this.CONDITION_STATEMENT_OPEN;
            const isCycleOpening = template.slice(i, i + this.CYCLE_STATEMENT_OPEN.length) === this.CYCLE_STATEMENT_OPEN;
            const isValueOpening = template.slice(i, i + this.VALUE_STATEMENT_OPEN.length) === this.VALUE_STATEMENT_OPEN;
            const isClosingCurrentTag = isTagOpen && currentClosingTag && template.slice(i, i + currentClosingTag.length) === currentClosingTag;
            const isOpeningNested = isTagOpen && ((isCycleOpening && currentClosingTag === this.CYCLE_STATEMENT_CLOSE) ||
                (isConditionOpening && currentClosingTag === this.CONDITION_STATEMENT_CLOSE));
            if (isConditionOpening || isCycleOpening) {
                if (isOpeningNested) {
                    tagOpenStack++;
                }
                else if (!isTagOpen) {
                    isTagOpen = true;
                    openTagIndex = i;
                    currentClosingTag =
                        isCycleOpening ? this.CYCLE_STATEMENT_CLOSE :
                            isConditionOpening ? this.CONDITION_STATEMENT_CLOSE :
                                '';
                }
            }
            else if (isClosingCurrentTag) {
                if (tagOpenStack !== 0) {
                    tagOpenStack--;
                }
                else {
                    isTagOpen = false;
                    closeTagIndex = i + currentClosingTag.length;
                    i += (currentClosingTag.length - 1);
                    const currentBlockTemplate = template.slice(openTagIndex, closeTagIndex);
                    const isBlockCondition = currentBlockTemplate.startsWith(this.CONDITION_STATEMENT_OPEN);
                    const isBlockCycle = currentBlockTemplate.startsWith(this.CYCLE_STATEMENT_OPEN);
                    const currentParsedBlock = (isBlockCondition ? this.parseCondition(currentBlockTemplate, data) :
                        isBlockCycle ? this.parseCycle(currentBlockTemplate, data) :
                            '');
                    compiledTemplate += currentParsedBlock;
                    openTagIndex = -1;
                    closeTagIndex = -1;
                }
            }
            else if (isValueOpening && !isTagOpen) {
                const valueMatches = template.slice(i).match(new RegExp(this.VALUE_PATTERN_STRING));
                if (valueMatches) {
                    const fullMatch = valueMatches[0];
                    const compiledValue = this.parseValue(fullMatch, data);
                    compiledTemplate += compiledValue;
                    i += (fullMatch.length - 1);
                }
            }
            else if (!isTagOpen) {
                compiledTemplate += template[i];
            }
        }
        return compiledTemplate;
    }
    static compile(template, data) {
        return this.parse(template, data);
    }
}
_a = AbsTemplate;
AbsTemplate.CONSOLE_PREFIX = '[ABS][TEMPLATE]';
AbsTemplate.VALUE_STATEMENT_OPEN = '{{';
AbsTemplate.VALUE_PATTERN_STRING = '{{(.+?)}}';
AbsTemplate.CONDITION_STATEMENT_OPEN = '{{if';
AbsTemplate.CONDITION_STATEMENT_PATTERN_STRING = '{{if (.+?)}}(.+?)(?:{{else}}(.+?))?{{/if}}';
AbsTemplate.CONDITION_PATTERN_STRING = '(.+) (==|===|!=|!==|>|>=|<|<=|&&|\|\||%|\^) (.+)';
AbsTemplate.CONDITION_STATEMENT_CLOSE = '{{/if}}';
AbsTemplate.CYCLE_STATEMENT_OPEN = '{{forEach';
AbsTemplate.CYCLE_STATEMENT_PATTERN_STRING = '{{forEach (.+?) in (.+?)}}(.*){{/forEach}}';
AbsTemplate.CYCLE_STATEMENT_CLOSE = '{{/forEach}}';
AbsTemplate.getContentFromTemplateNode = (templateNode) => {
    const templateNodeContent = templateNode.innerHTML;
    const domParser = new DOMParser();
    const parsedDocument = domParser.parseFromString(templateNodeContent, 'text/html');
    const parsedDocumentBodyNode = parsedDocument.querySelector('body');
    return parsedDocumentBodyNode.innerHTML;
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
    },
    deepCopy: (inObject) => {
        let outObject, value, key;
        if (typeof inObject !== 'object' || inObject === null) {
            return inObject;
        }
        outObject = Array.isArray(inObject) ? [] : {};
        for (key in inObject) {
            value = inObject[key];
            outObject[key] = _a._utils.deepCopy(value);
        }
        return outObject;
    },
    getValueByPath: (obj, path) => {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                return undefined;
            }
        }
        return value;
    },
    if: {
        parseContentFromCondition: (conditionResult, data, positiveContent, negativeContent) => {
            let compiledContent = '';
            compiledContent = _a.parse(conditionResult ? positiveContent || '' : negativeContent || '', data);
            return compiledContent;
        },
        sanitizeParameter: (parameter) => {
            return (!Number.isNaN(parseFloat(parameter)) ? parseFloat(parameter) :
                parameter === 'true' ? true :
                    parameter === 'false' ? false :
                        parameter === 'undefined' ? undefined :
                            parameter === 'null' ? null :
                                parameter);
        },
        isParameterLiteralString: (parameter) => {
            return typeof parameter === 'string' && ((parameter.startsWith(`'`) && parameter.endsWith(`'`)) ||
                (parameter.startsWith(`"`) && parameter.endsWith(`"`)));
        },
        fixStringLiteral: (parameter) => {
            if (_a._utils.if.isParameterLiteralString(parameter)) {
                return parameter.slice(1, parameter.length - 1);
            }
            else {
                return parameter;
            }
        },
        isParameterLiteral: (parameter) => {
            const isParamKeyword = Boolean(typeof parameter === 'number' ||
                _a._utils.if.isParameterLiteralString(parameter) ||
                parameter === true ||
                parameter === false ||
                parameter === null ||
                parameter === undefined);
            return isParamKeyword;
        },
    },
    _log: (template, position) => {
        let res = '';
        const COL = '%c';
        res += COL;
        for (let i = 0; i < template.length; i++) {
            res += i === position ? COL : '';
            res += template[i];
        }
        console.log(res, 'color: lime;', 'color: white;');
    },
};
//# sourceMappingURL=abs-template.js.map