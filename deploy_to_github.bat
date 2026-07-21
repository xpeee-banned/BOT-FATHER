@echo off
echo ==========================================
echo   BotFather - Despliegue a GitHub
echo ==========================================
echo Iniciando repositorio local...
git init
git branch -M main
git add .
git commit -m "Initial commit - BotFather App"

echo.
echo Por favor, introduce la URL de tu repositorio de GitHub (ej. https://github.com/tu-usuario/tu-repo.git):
set /p REPO_URL=URL: 

if "%REPO_URL%"=="" (
    echo Error: Debes introducir una URL valida.
    pause
    exit /b
)

git remote add origin %REPO_URL%
echo.
echo Subiendo los archivos a GitHub...
git push -u origin main --force

echo.
echo ==========================================
echo   ¡Subida completada con exito!
echo   Tu app ya esta en tu repositorio.
echo ==========================================
pause
