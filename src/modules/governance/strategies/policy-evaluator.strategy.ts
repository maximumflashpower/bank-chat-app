import { Injectable, Logger } from '@nestjs/common';

export interface IEvaluationStrategy {
  evaluate(
    codeContent: string,
    input: Record<string, any>,
  ): { result: string; rationale: string };
}

/**
 * Strategy for evaluating JSON-based policy rules.
 * Future implementations can add Rego/CEL/OPA strategies.
 */
@Injectable()
export class JsonRuleEvaluatorStrategy implements IEvaluationStrategy {
  private readonly logger = new Logger(JsonRuleEvaluatorStrategy.name);

  evaluate(
    codeContent: string,
    input: Record<string, any>,
  ): { result: string; rationale: string } {
    try {
      const rules = JSON.parse(codeContent);
      if (!rules.conditions || !Array.isArray(rules.conditions)) {
        return {
          result: 'undefined',
          rationale: 'No conditions defined in policy',
        };
      }
      let allMatch = true;
      for (const cond of rules.conditions) {
        const inputValue = input[cond.field];
        if (!this.compare(inputValue, cond.operator, cond.value)) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return {
          result: rules.action || 'deny',
          rationale: `All conditions matched — action triggered`,
        };
      }
      return { result: 'permit', rationale: 'Conditions not met — permitted' };
    } catch (e) {
      this.logger.error(`Failed to evaluate policy: ${e.message}`);
      return { result: 'undefined', rationale: `Parse error: ${e.message}` };
    }
  }

  private compare(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '==':
        return actual == expected;
      case '!=':
        return actual != expected;
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }
}

// TODO: RegoEvaluatorStrategy — requires OPA sidecar
// TODO: CelEvaluatorStrategy — requires CEL interpreter
// TODO: OpaEvaluatorStrategy — requires OPA binary
