@echo off
REM Script para compilar circuitos Circom usando Docker

echo === Configuración para compilar circuitos Circom con Docker ===
echo.

REM Verificar si Docker está instalado
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker no está instalado o no está en el PATH.
    echo Por favor instala Docker Desktop desde https://www.docker.com/products/docker-desktop/
    goto :end
)

echo 1. Construyendo la imagen Docker (esto puede tomar unos minutos)...
docker build -t zk-circom .

REM Obtener el parámetro del circuito a compilar
set CIRCUIT=%1
if "%CIRCUIT%"=="" (
    echo.
    echo Error: Debes especificar un archivo de circuito.
    echo Uso: %0 [ruta/al/circuito.circom]
    echo Ejemplo: %0 circuits/mixer.circom
    goto :end
)

REM Verificar que el archivo existe
if not exist "%CIRCUIT%" (
    echo.
    echo Error: El archivo de circuito %CIRCUIT% no existe.
    goto :end
)

echo.
echo 2. Compilando el circuito %CIRCUIT%...

REM Obtener el directorio del archivo
set CIRCUIT_DIR=%~dp1
set CIRCUIT_NAME=%~nx1
set OUTPUT_DIR=build/zk/%~n1

REM Crear el directorio de salida si no existe
mkdir "%OUTPUT_DIR%" 2>nul

echo.
echo 3. Ejecutando Docker para compilar el circuito...
docker run --rm -v "%CD%:/app" zk-circom circom "%CIRCUIT%" --r1cs --wasm --sym --output "%OUTPUT_DIR%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error durante la compilación. Revisa los mensajes anteriores.
    goto :end
)

echo.
echo === Compilación completada con éxito ===
echo Archivos generados en: %OUTPUT_DIR%
echo.

:end
pause 