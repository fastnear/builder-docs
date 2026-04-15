import { translate } from '@docusaurus/Translate';

export const FINALITY_OPTIONS = [
  {
    value: "optimistic",
    label: translate({
      id: 'fastnear.finality.optimistic.label',
      message: 'Optimistic',
    }),
    description: translate({
      id: 'fastnear.finality.optimistic.description',
      message:
        'The latest block the node has seen. Fastest to update, but with the least confirmation.',
    }),
  },
  {
    value: "near-final",
    label: translate({
      id: 'fastnear.finality.nearFinal.label',
      message: 'Near-final',
    }),
    description: translate({
      id: 'fastnear.finality.nearFinal.description',
      message:
        'The latest block with doomslug finality. Stronger confirmation that usually trails the head slightly.',
    }),
  },
  {
    value: "final",
    label: translate({
      id: 'fastnear.finality.final.label',
      message: 'Final',
    }),
    description: translate({
      id: 'fastnear.finality.final.description',
      message:
        'The latest block with full finality. Highest confidence, with the most confirmation lag.',
    }),
  },
];
