#!/bin/zsh
set -euo pipefail

endpoint="http://127.0.0.1:3000/api/deal-checker"

run_case() {
  local name="$1"
  local payload="$2"
  local response
  local tmp_file
  local http_code

  tmp_file=$(mktemp)
  http_code=$(curl -s -o "$tmp_file" -w "%{http_code}" -X POST -H 'content-type: application/json' -d "$payload" "$endpoint")
  response=$(cat "$tmp_file")
  rm -f "$tmp_file"

  if [[ "$http_code" != "200" || -z "$response" ]]; then
    echo "Empty response for: $name" >&2
    exit 1
  fi

  echo "$response"
}

case_one=$(run_case \
  "RTX 4080 SUPER + 7800X3D" \
  '{"title":"Komputer do gier 7800x3d RTX 4080 SUPER","description":"Ryzen 7 7800X3D, RTX 4080 SUPER, 32GB RAM DDR5, B650, 1TB NVMe, 750W Gold, stan bardzo dobry","price":6999}')

echo "$case_one" | grep -q '"name":"Ryzen 7 7800X3D"'
echo "$case_one" | grep -q '"name":"RTX 4080 SUPER"'
echo "$case_one" | grep -Eq '"estimatedMarketValue":[4-9][0-9]{3,}'

case_two=$(run_case \
  "RTX 4070 + Ryzen 5 9600" \
  '{"title":"PC Ryzen 5 9600 RTX 4070","description":"RTX 4070, Ryzen 5 9600, 32GB DDR5, B650, 1TB SSD, zasilacz 750W, stan używany","price":1780}')

echo "$case_two" | grep -q '"name":"Ryzen 5 9600"'
echo "$case_two" | grep -q '"name":"RTX 4070"'
if echo "$case_two" | grep -q '"verdict":"nieopłacalna"'; then
  echo "Case two should not be marked as nieopłacalna." >&2
  exit 1
fi

case_three=$(run_case \
  "RTX 3060 + i5-12400F" \
  '{"title":"Komputer i5-12400F RTX 3060","description":"Intel Core i5-12400F, RTX 3060 12GB, 16GB RAM, 1TB NVMe, B660, PSU 650W","price":2599}')

echo "$case_three" | grep -q '"name":"Intel Core i5-12400F"'
echo "$case_three" | grep -q '"name":"RTX 3060"'
echo "$case_three" | grep -Eq '"estimatedMarketValue":[1-9][0-9]{3,}'

echo "Checker regression tests passed."
