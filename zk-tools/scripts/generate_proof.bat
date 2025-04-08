@echo off
REM Script para generar pruebas con circuitos compilados

echo === Generación de pruebas ZK usando Docker ===
echo.

REM Verificar si Docker está instalado
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker no está instalado o no está en el PATH.
    echo Por favor instala Docker Desktop desde https://www.docker.com/products/docker-desktop/
    goto :end
)

REM Obtener el parámetro del circuito
set CIRCUIT=%1
if "%CIRCUIT%"=="" (
    echo.
    echo Error: Debes especificar un nombre de circuito (sin extensión).
    echo Uso: %0 [nombre_circuito] [archivo_input.json]
    echo Ejemplo: %0 test_circuit inputs/example_input.json
    goto :end
)

REM Obtener el archivo de input
set INPUT_FILE=%2
if "%INPUT_FILE%"=="" (
    echo.
    echo Error: Debes especificar un archivo de input.
    echo Uso: %0 [nombre_circuito] [archivo_input.json]
    echo Ejemplo: %0 test_circuit inputs/example_input.json
    goto :end
)

REM Verificar que el archivo de input existe
if not exist "%INPUT_FILE%" (
    echo.
    echo Error: El archivo de input %INPUT_FILE% no existe.
    goto :end
)

set CIRCUIT_DIR=build/zk/%CIRCUIT%
set WASM_FILE=%CIRCUIT_DIR%/%CIRCUIT%_js/%CIRCUIT%.wasm

REM Verificar que el circuito está compilado
if not exist "%WASM_FILE%" (
    echo.
    echo Error: El circuito %CIRCUIT% no parece estar compilado correctamente.
    echo Por favor, compila primero el circuito usando compile_circuit.bat.
    goto :end
)

echo.
echo 1. Descargando Powers of Tau...
if not exist "%CIRCUIT_DIR%/pot12_final.ptau" (
    curl -L -o %CIRCUIT_DIR%/pot12_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau
)

echo.
echo 2. Generando testigo...
docker run --rm -v "%CD%:/app" zk-circom node %CIRCUIT_DIR%/%CIRCUIT%_js/generate_witness.js %WASM_FILE% %INPUT_FILE% %CIRCUIT_DIR%/witness.wtns

echo.
echo 3. Configurando fase 2...
docker run --rm -v "%CD%:/app" zk-circom snarkjs groth16 setup %CIRCUIT_DIR%/%CIRCUIT%.r1cs %CIRCUIT_DIR%/pot12_final.ptau %CIRCUIT_DIR%/%CIRCUIT%_0000.zkey

echo.
echo 4. Contribuyendo a la fase 2...
docker run --rm -v "%CD%:/app" zk-circom snarkjs zkey contribute %CIRCUIT_DIR%/%CIRCUIT%_0000.zkey %CIRCUIT_DIR%/%CIRCUIT%_final.zkey --name="Developer" -v -e="random entropy"

echo.
echo 5. Exportando clave de verificación...
docker run --rm -v "%CD%:/app" zk-circom snarkjs zkey export verificationkey %CIRCUIT_DIR%/%CIRCUIT%_final.zkey %CIRCUIT_DIR%/verification_key.json

echo.
echo 6. Generando prueba...
docker run --rm -v "%CD%:/app" zk-circom snarkjs groth16 prove %CIRCUIT_DIR%/%CIRCUIT%_final.zkey %CIRCUIT_DIR%/witness.wtns %CIRCUIT_DIR%/proof.json %CIRCUIT_DIR%/public.json

echo.
echo 7. Verificando prueba...
docker run --rm -v "%CD%:/app" zk-circom snarkjs groth16 verify %CIRCUIT_DIR%/verification_key.json %CIRCUIT_DIR%/public.json %CIRCUIT_DIR%/proof.json

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error durante la verificación de la prueba. Revisa los mensajes anteriores.
    goto :end
)

echo.
echo 8. Exportando verificador Solidity...
docker run --rm -v "%CD%:/app" zk-circom snarkjs zkey export solidityverifier %CIRCUIT_DIR%/%CIRCUIT%_final.zkey contracts/%CIRCUIT%_Verifier.sol

echo.
echo === Proceso completado con éxito ===
echo - Prueba generada: %CIRCUIT_DIR%/proof.json
echo - Entradas públicas: %CIRCUIT_DIR%/public.json
echo - Verificador Solidity: contracts/%CIRCUIT%_Verifier.sol
echo.

:end
pause 