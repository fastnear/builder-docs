export const FINALITY_OPTIONS = [
  {
    value: "optimistic",
    label: "Optimistic",
    description:
      "The latest block the node has seen. Fastest to update, but with the least confirmation.",
  },
  {
    value: "near-final",
    label: "Near-final",
    description:
      "The latest block with doomslug finality. Stronger confirmation that usually trails the head slightly.",
  },
  {
    value: "final",
    label: "Final",
    description:
      "The latest block with full finality. Highest confidence, with the most confirmation lag.",
  },
];
