#!/usr/bin/env bash
# Pool completo en paralelo: 4 fragmentos de medición + fusión y miniaturas.
#   scripts/specimens/build-pool.sh [--seed 2027] [--count 2030] [--res 56] [--hall 200]
set -euo pipefail
cd "$(dirname "$0")/../.."
N=4
for k in $(seq 0 $((N-1))); do
  npx tsx scripts/specimens/build-pool.ts --shard "$k" --of "$N" "$@" > "/tmp/np-shard-$k.log" 2>&1 &
done
wait
npx tsx scripts/specimens/build-pool.ts --merge "$N" "$@"
