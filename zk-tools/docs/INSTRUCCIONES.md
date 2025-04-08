# Instrucciones para usar Docker con Circom

## Requisitos previos
1. Instala [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/)
2. Reinicia tu computadora después de la instalación

## Paso 1: Compilar circuitos
1. Abre una terminal (CMD o PowerShell) en este directorio
2. Ejecuta el script para compilar un circuito:

```
compile_circuit.bat circuits/test_circuit.circom
```

Este comando:
- Construirá una imagen Docker con Circom y todas sus dependencias
- Compilará el circuito de prueba
- Generará los archivos de salida en `build/zk/test_circuit/`

3. Para compilar el circuito optimizado:

```
compile_circuit.bat circuits/mixer_optimized.circom
```

4. Para compilar el circuito mejorado:

```
compile_circuit.bat circuits/mixer.circom
```

## Paso 2: Generar y verificar pruebas

Una vez que hayas compilado un circuito, puedes generar y verificar pruebas:

```
generate_proof.bat test_circuit inputs/example_input.json
```

Para los circuitos mejorados:

```
generate_proof.bat mixer inputs/optimized_input.json
```

Para el circuito optimizado:

```
generate_proof.bat mixer_optimized inputs/optimized_input.json
```

Este script:
- Descarga Powers of Tau (si es necesario)
- Genera el testigo usando el archivo de entrada
- Configura y completa la fase 2 de la configuración trusted
- Genera una prueba ZK
- Verifica la prueba
- Exporta un contrato verificador Solidity

## Solución de problemas

Si experimentas errores:

1. Asegúrate de que Docker está en ejecución (el icono de Docker debe aparecer en la barra de tareas)
2. Verifica que has instalado Docker Desktop correctamente
3. Ejecuta como administrador si es necesario
4. En caso de errores con entradas, asegúrate de que los archivos de entrada JSON tienen el formato correcto:
   - Para el circuito de prueba: valor `a` y `b` simples
   - Para circuitos mixer: todos los campos necesarios como root, nullifierHash, etc.

## Explicación

Este enfoque utiliza Docker para crear un entorno Linux aislado donde Circom puede ejecutarse sin problemas de codificación o compatibilidad de Windows. Docker monta tu directorio actual dentro del contenedor, lo que permite a Circom acceder a tus archivos y guardar los resultados en tu sistema de archivos local.

### Estructura del proyecto después de compilar

```
project/
├── build/
│   └── zk/
│       ├── test_circuit/      # Archivos compilados del circuito de prueba
│       ├── mixer/             # Archivos compilados del circuito mejorado
│       └── mixer_optimized/   # Archivos compilados del circuito optimizado
├── circuits/
│   ├── test_circuit.circom
│   ├── mixer.circom
│   └── mixer_optimized.circom
├── contracts/
│   ├── test_circuit_Verifier.sol  # Verificador generado automáticamente 
│   ├── mixer_Verifier.sol
│   └── mixer_optimized_Verifier.sol
└── inputs/
    ├── example_input.json
    ├── optimized_input.json
    └── optimized_debug_input.json
``` 