import { DynamicStructuredTool } from "@langchain/core/tools";
import { logInfo, logSuccess, logError } from "../../../utils/logger.js";

export function createTool({ name, description, schema, handler }) {
  return new DynamicStructuredTool({
    name,

    description,

    schema,

    func: async (input, config) => {
      logInfo("AI Tool Invoked", {
        tool: name,
      });
      try {
        const result = await handler(input, config);

        logSuccess("AI Tool Completed", {
          tool: name,
        });

        return JSON.stringify({
          success: true,
          data: result,
        });
      } catch (error) {
        logError(`Tool Failed: ${name}`, error);

        return JSON.stringify({
          success: false,
          message: error.message,
        });
      }
    },
  });
}
