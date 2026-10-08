export default class ELK {
  async layout(graph: any) {
    let y = 40;
    for (const child of graph.children ?? []) {
      child.x = child.x ?? 40;
      child.y = child.y ?? y;
      child.width = child.width ?? 80;
      child.height = child.height ?? 40;
      y += 60;
    }
    for (const edge of graph.edges ?? []) {
      edge.sections = edge.sections ?? [
        {
          startPoint: { x: 40, y: 40 },
          endPoint: { x: 40, y: 80 },
        },
      ];
    }
    return graph;
  }
}
