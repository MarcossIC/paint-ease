#!/bin/bash
branch=$(git rev-parse --abbrev-ref HEAD)
git push origin "$branch"