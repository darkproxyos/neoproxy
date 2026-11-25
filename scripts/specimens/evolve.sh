#!/usr/bin/env bash
# Una generación de evolución del salón, en 4 núcleos.
#   scripts/specimens/evolve.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
N=4
run() { # etapa
  for k in $(seq 0 $((N-1))); do
    npx tsx scripts/specimens/evolve.ts "--$1" "$k" --of "$N" > "/tmp/np-evo-$1-$k.log" 2>&1 &
  done
  wait
  for k in $(seq 0 $((N-1))); do cat "/tmp/np-evo-$1-$k.log"; done
}
run measure
npx tsx scripts/specimens/evolve.ts --select
run offspring
npx tsx scripts/specimens/evolve.ts --merge
run thumbs
echo "miniaturas: $(ls public/proxygenesis/pool-thumbs | wc -l)"
