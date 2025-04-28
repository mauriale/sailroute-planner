#!/bin/bash

# Script para configurar los secrets de GitHub necesarios para el despliegue
# Necesitas tener instalado el GitHub CLI (gh)

# Configurar REACT_APP_WINDY_API_KEY
gh secret set REACT_APP_WINDY_API_KEY --body "wnHVKmdTiUcxckbS2wSXNflKgVjBTsPZ"

# Configurar REACT_APP_GEOAPIFY_API_KEY
gh secret set REACT_APP_GEOAPIFY_API_KEY --body "884ca322913f45a38cc8d3a2f47a2e83"

echo "Secrets configurados correctamente!"
