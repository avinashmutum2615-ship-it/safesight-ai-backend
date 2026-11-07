import { START, END, StateGraph } from "@langchain/langgraph";

import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { GraphState } from "./state.js";
import { chatbotNode } from "../nodes/chatbotNode.js";
import { receptionistTools } from "../tools/index.js";
import { publicTools } from "../tools/public/index.js";
import { doctorTools } from "../tools/doctor/index.js";
import { checkpointer } from "../memory/checkpointer.js";

const graph = new StateGraph(GraphState);

graph.addNode("chatbot", chatbotNode);
graph.addNode("tools", async (state, config) => {
  const allowed = {
    public: publicTools,
    doctor: doctorTools,
    receptionist: receptionistTools,
  }[config.configurable.agent];
  if (!allowed) throw new Error("Unknown agent role.");
  return new ToolNode(allowed).invoke(state, config);
});

graph.addEdge(START, "chatbot");

graph.addConditionalEdges("chatbot", toolsCondition);

graph.addEdge("tools", "chatbot");

export const chatbotGraph = graph.compile({
  checkpointer,
});
