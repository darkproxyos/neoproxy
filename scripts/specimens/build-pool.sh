#!/usr/bin/env bash
# Pool completo en 4 núcleos: medir -> fusionar y elegir -> miniaturas.
#   scripts/specimens/build-pool.sh [--seed 2028] [--count 2200] [--res 56] [--hall 240]
set -euo pipefail
cd "$(dirname "$0")/../.."
N=4
run() { # etapa, flag
  for k in $(seq 0 $((N-1))); do
    npx tsx scripts/specimens/build-pool.ts "--$1" "$k" --of "$N" "${@:2}" > "/tmp/np-$1-$k.log" 2>&1 &
  done
  wait
}
run shard "$@"
npx tsx scripts/specimens/build-pool.ts --merge "$N" "$@"
run thumbs "$@"
echo "miniaturas: $(ls public/proxygenesis/pool-thumbs | wc -l)"
