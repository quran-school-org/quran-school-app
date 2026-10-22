#!/usr/bin/env bash
# Lance une commande SANS variables de proxy sortant (conteneurs d'agent, D48).
# firebase-tools envoie ses requêtes internes (Hosting → Functions sur
# 127.0.0.1) au proxy HTTPS_PROXY sans respecter NO_PROXY (D11, D21) : on les
# retire pour ce seul processus. Aucun effet sur un poste sans proxy.
# Usage : scripts/dev/without-proxy.sh npm run test:hosting
set -euo pipefail
exec env -u HTTPS_PROXY -u https_proxy -u HTTP_PROXY -u http_proxy -u ALL_PROXY -u all_proxy \
  -u GLOBAL_AGENT_HTTPS_PROXY -u GLOBAL_AGENT_HTTP_PROXY -u npm_config_https_proxy -u npm_config_proxy \
  -u YARN_HTTPS_PROXY "$@"
