# Mejoras de Seguridad y Optimización para ZK Mixer

Este documento explica las mejoras implementadas en los circuitos de ZK Mixer y los pasos para compilarlos y probarlos correctamente.

## 1. Mejoras Implementadas

Hemos realizado las siguientes mejoras en los circuitos:

### 1.1 Mejoras de Seguridad (`mixer.circom`)

- **Validación de entradas privadas**: Se ha añadido validación para asegurar que `secret` y `nullifier` no sean cero, lo que previene ciertos ataques.
- **Protección contra ataques de replay**: Se ha mejorado `nullifierHash` para incluir `chainId`, protegiendo contra ataques de replay entre diferentes cadenas.
- **Validación económica**: Se ha agregado validación para asegurar que las tarifas (`fee`) no excedan los reembolsos (`refund`).
- **Validación de relayer**: Se asegura que si hay una tarifa, el relayer no sea la dirección cero (address(0)).
- **Prevención de fugas de información**: Se mantiene una separación estricta entre entradas privadas y públicas.

### 1.2 Optimizaciones de Restricciones (`mixer_optimized.circom`)

- **Validación combinada**: En lugar de usar dos componentes `IsZero` separados para verificar `secret` y `nullifier`, usamos una validación combinada más eficiente.
- **Optimización de validación de tarifa**: Usamos un enfoque con menos restricciones para validar que `fee <= refund` sin usar el componente `LessThan`.
- **Reutilización de señales**: Minimizamos la creación de señales intermedias innecesarias.
- **Estructura eficiente para nullifierHash**: Diseño optimizado pero seguro para el cálculo del hash del nullifier.

### 1.3 Limpieza de Código

- Script `cleanup.js` para eliminar archivos obsoletos (`poseidon_old.circom`, `poseidon_constants_old.circom`, `pedersen_old.circom`).
- Documentación mejorada con explicaciones detalladas de los componentes y su propósito.

## 2. Archivos Generados

Hemos generado los siguientes archivos:

- `circuits/mixer.circom`: Versión mejorada con características de seguridad adicionales.
- `circuits/mixer_optimized.circom`: Versión optimizada que reduce el número de restricciones.
- `scripts/generate_optimized_inputs.js`: Script para generar entradas compatibles con los circuitos mejorados.
- `inputs/optimized_input.json`: Entradas con valores reales aleatorios.
- `inputs/optimized_debug_input.json`: Entradas con valores simples para depuración.
- `docs/circuit_security_guidelines.md`: Directrices de seguridad para el desarrollo de circuitos ZK.

## 3. Pasos para Compilar y Probar

Para compilar y probar los circuitos mejorados:

### 3.1 Compilación

```bash
# Crear directorios de salida
mkdir -p build/zk/enhanced
mkdir -p build/zk/optimized

# Compilar versión mejorada
npx circom circuits/mixer.circom --r1cs --wasm --sym --output build/zk/enhanced

# Compilar versión optimizada
npx circom circuits/mixer_optimized.circom --r1cs --wasm --sym --output build/zk/optimized
```

### 3.2 Configuración y Generación de Pruebas

```bash
# Descargar Powers of Tau
curl -L -o build/zk/pot12_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# Configuración para el circuito mejorado
npx snarkjs groth16 setup build/zk/enhanced/mixer.r1cs build/zk/pot12_final.ptau build/zk/enhanced/mixer_0000.zkey
npx snarkjs zkey contribute build/zk/enhanced/mixer_0000.zkey build/zk/enhanced/mixer_final.zkey --name="Development" -v -e="random"
npx snarkjs zkey export verificationkey build/zk/enhanced/mixer_final.zkey build/zk/enhanced/verification_key.json

# Configuración para el circuito optimizado
npx snarkjs groth16 setup build/zk/optimized/mixer_optimized.r1cs build/zk/pot12_final.ptau build/zk/optimized/mixer_optimized_0000.zkey
npx snarkjs zkey contribute build/zk/optimized/mixer_optimized_0000.zkey build/zk/optimized/mixer_optimized_final.zkey --name="Development" -v -e="random"
npx snarkjs zkey export verificationkey build/zk/optimized/mixer_optimized_final.zkey build/zk/optimized/verification_key.json
```

### 3.3 Generación de Contratos Verificadores

```bash
# Generar contrato verificador para el circuito mejorado
npx snarkjs zkey export solidityverifier build/zk/enhanced/mixer_final.zkey contracts/EnhancedVerifier.sol

# Generar contrato verificador para el circuito optimizado
npx snarkjs zkey export solidityverifier build/zk/optimized/mixer_optimized_final.zkey contracts/OptimizedVerifier.sol
```

### 3.4 Generación de Pruebas

```bash
# Calcular testigo y generar prueba para el circuito mejorado
node build/zk/enhanced/mixer_js/generate_witness.js build/zk/enhanced/mixer_js/mixer.wasm inputs/optimized_debug_input.json build/zk/enhanced/witness.wtns
npx snarkjs groth16 prove build/zk/enhanced/mixer_final.zkey build/zk/enhanced/witness.wtns build/zk/enhanced/proof.json build/zk/enhanced/public.json

# Calcular testigo y generar prueba para el circuito optimizado
node build/zk/optimized/mixer_optimized_js/generate_witness.js build/zk/optimized/mixer_optimized_js/mixer_optimized.wasm inputs/optimized_debug_input.json build/zk/optimized/witness.wtns
npx snarkjs groth16 prove build/zk/optimized/mixer_optimized_final.zkey build/zk/optimized/witness.wtns build/zk/optimized/proof.json build/zk/optimized/public.json
```

### 3.5 Verificación

```bash
# Verificar prueba para el circuito mejorado
npx snarkjs groth16 verify build/zk/enhanced/verification_key.json build/zk/enhanced/public.json build/zk/enhanced/proof.json

# Verificar prueba para el circuito optimizado
npx snarkjs groth16 verify build/zk/optimized/verification_key.json build/zk/optimized/public.json build/zk/optimized/proof.json
```

## 4. Comparación de Restricciones

Para comparar el número de restricciones entre las diferentes versiones:

```bash
# Obtener número de restricciones para el circuito original
npx circom circuits/mixer.circom --r1cs --print | grep "constraints"

# Obtener número de restricciones para el circuito optimizado
npx circom circuits/mixer_optimized.circom --r1cs --print | grep "constraints"
```

Esperamos una reducción del 10-15% en el número de restricciones en la versión optimizada, principalmente debido a:
- Validación combinada para entradas no-cero
- Optimización en la validación de tarifas
- Diseño eficiente para nullifierHash

## 5. Solución de Problemas

Si se encuentran errores al compilar o probar, consulte:

- **Errores de SMTVerifier**: Asegúrese de que el último elemento en `pathElements` sea cero y que al menos un elemento anterior (típicamente el penúltimo) sea no-cero.
- **Errores en nullifierHash**: Verifique que se use la misma implementación de Poseidon tanto en el circuito como en el script de generación de entradas.
- **Errores en validación de entradas**: Asegúrese de que todas las entradas estén en el formato correcto y dentro de los rangos esperados.

## 6. Consideraciones para Producción

Para entornos de producción, tenga en cuenta:

- Utilice una ceremonia segura para la fase 2 de configuración (generación de `.zkey`).
- Implemente pruebas exhaustivas, incluyendo casos límite y entradas maliciosas.
- Considere auditorías externas específicas para los circuitos ZK.
- Confirme que las entradas privadas tengan suficiente entropía y sean generadas de manera segura. 