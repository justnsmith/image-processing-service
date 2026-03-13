#!/usr/bin/env bash
# scripts/ci.sh — Run the same checks as the GitHub Actions lint workflow locally.
# Usage: ./scripts/ci.sh [--fix]
#
# Options:
#   --fix   Auto-fix formatting issues where possible (gofmt -w, clang-format -i).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FIX=false
if [[ "${1:-}" == "--fix" ]]; then
  FIX=true
fi

PASS=0
FAIL=0

green()  { printf "\033[0;32m%s\033[0m\n" "$*"; }
red()    { printf "\033[0;31m%s\033[0m\n" "$*"; }
yellow() { printf "\033[0;33m%s\033[0m\n" "$*"; }
header() { printf "\n\033[1;34m==> %s\033[0m\n" "$*"; }

ok()   { green  "  PASS: $*"; ((PASS++)) || true; }
fail() { red    "  FAIL: $*"; ((FAIL++)) || true; }
skip() { yellow "  SKIP: $*"; }

# ---------------------------------------------------------------------------
# Go checks
# ---------------------------------------------------------------------------

header "Go: gofmt formatting"
if ! command -v gofmt &>/dev/null; then
  skip "gofmt not found — install Go first"
else
  unformatted=$(gofmt -l .)
  if [ -n "$unformatted" ]; then
    if $FIX; then
      gofmt -w .
      ok "gofmt (auto-fixed)"
    else
      fail "gofmt — unformatted files:"
      echo "$unformatted" | sed 's/^/    /'
      echo "  Tip: run './scripts/ci.sh --fix' or 'gofmt -w .'"
    fi
  else
    ok "gofmt"
  fi
fi

header "Go: go vet"
if ! command -v go &>/dev/null; then
  skip "go not found"
else
  if go vet ./... 2>&1 | tee /tmp/go-vet-output.txt | grep -q '^'; then
    # go vet only exits non-zero on errors; check exit code explicitly
    if go vet ./... 2>/dev/null; then
      ok "go vet"
    else
      fail "go vet"
      cat /tmp/go-vet-output.txt | sed 's/^/    /'
    fi
  fi
fi

# ---------------------------------------------------------------------------
# C++ checks
# ---------------------------------------------------------------------------

CPP_FILES=()
while IFS= read -r -d '' f; do
  CPP_FILES+=("$f")
done < <(find . \( -name "*.cpp" -o -name "*.cc" -o -name "*.cxx" -o -name "*.h" -o -name "*.hpp" \) \
  ! -path "*/node_modules/*" ! -path "*/vendor/*" ! -path "*/.git/*" -print0 2>/dev/null)

if [ "${#CPP_FILES[@]}" -eq 0 ]; then
  header "C++: cppcheck"
  skip "no C++ files found"

  header "C++: clang-format"
  skip "no C++ files found"
else
  header "C++: cppcheck"
  if ! command -v cppcheck &>/dev/null; then
    skip "cppcheck not installed (brew install cppcheck / apt install cppcheck)"
  else
    if cppcheck \
        --enable=warning,style,performance,portability \
        --error-exitcode=1 \
        --suppress=missingIncludeSystem \
        --inline-suppr \
        --quiet \
        "${CPP_FILES[@]}" 2>&1; then
      ok "cppcheck"
    else
      fail "cppcheck"
    fi
  fi

  header "C++: clang-format"
  if ! command -v clang-format &>/dev/null; then
    skip "clang-format not installed (brew install clang-format / apt install clang-format)"
  else
    unformatted_cpp=()
    for f in "${CPP_FILES[@]}"; do
      if ! clang-format --dry-run --Werror "$f" 2>/dev/null; then
        unformatted_cpp+=("$f")
      fi
    done

    if [ "${#unformatted_cpp[@]}" -gt 0 ]; then
      if $FIX; then
        clang-format -i "${unformatted_cpp[@]}"
        ok "clang-format (auto-fixed)"
      else
        fail "clang-format — unformatted files:"
        for f in "${unformatted_cpp[@]}"; do echo "    $f"; done
        echo "  Tip: run './scripts/ci.sh --fix' or 'clang-format -i <file>'"
      fi
    else
      ok "clang-format"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

printf "\n"
printf "Results: "
green "${PASS} passed"
if [ "$FAIL" -gt 0 ]; then
  fail "${FAIL} failed"
  exit 1
fi
