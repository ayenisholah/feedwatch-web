#!/bin/sh
# pre-push guard: main changes only through pull requests. Git passes one
# "<local ref> <local sha> <remote ref> <remote sha>" line per ref on stdin.
# The first push of a new repository is the one exception: set FEEDWATCH_INITIAL_PUSH=1.
[ "${FEEDWATCH_INITIAL_PUSH:-}" = "1" ] && exit 0
while read -r _local_ref _local_sha remote_ref _remote_sha; do
  if [ "$remote_ref" = "refs/heads/main" ]; then
    echo "Direct pushes to main are blocked. Push a feature branch and open a pull request." >&2
    exit 1
  fi
done
exit 0
