# ZK Circuit Security Guidelines

Este documento contiene las mejores prácticas y directrices de seguridad para el desarrollo de circuitos de conocimiento cero (ZK) en el proyecto ZK Mixer, basado en las mejoras y auditorías realizadas.

## 1. Principios fundamentales de seguridad

### Prevención de fugas de información
- **Separación clara**: Mantén una separación estricta entre entradas privadas y públicas.
- **Consistencia criptográfica**: Asegúrate de que los mismos algoritmos de hash se utilicen de manera consistente tanto en circuitos como en código externo.

### Protección contra ataques de replay
- **Incluye identificadores únicos**: Incorpora el chainId en el nullifierHash para prevenir ataques de replay entre cadenas.
- **Vincula el destinatario**: Incluye la dirección del destinatario en el nullifierHash para evitar redireccionamiento no autorizado.

### Validación de entradas
- **Verificación de no-cero**: Valida que las entradas sensibles como nullifier y secret no sean cero.
- **Validaciones económicas**: Asegura que las tarifas no superen los valores razonables (por ejemplo, fee <= refund).

## 2. Optimización de restricciones

### Técnicas de optimización
- **Combina validaciones**: Usa una sola comprobación para validar múltiples condiciones cuando sea posible (`nonZeroSecret <== secret * nullifier`).
- **Evita componentes pesados**: Sustituye componentes con muchas restricciones (como `LessThan`) por enfoques más eficientes cuando sea posible.
- **Reutiliza señales**: Minimiza la creación de señales intermedias innecesarias.

### Medición y benchmarking
- **Conteo de restricciones**: Documenta y monitorea el número de restricciones en cada versión del circuito.
- **Pruebas de rendimiento**: Mide los tiempos de generación y verificación de pruebas con diferentes tamaños de entradas.

## 3. Estructura del nullifierHash

### Diseño seguro
```circom
// Diseño seguro del nullifierHash
component nullifierHasher = Poseidon(3);
nullifierHasher.inputs[0] <== nullifier;      // Valor privado
nullifierHasher.inputs[1] <== recipient;      // Previene ataques de replay
nullifierHasher.inputs[2] <== chainId;        // Previene ataques cross-chain
```

### Consideraciones
- El nullifierHash debe ser único para cada retiro.
- Incluir parámetros de contexto (recipient, chainId) evita ataques donde un atacante puede reutilizar una prueba válida en diferentes contextos.

## 4. Estructura del commitment

### Diseño seguro
```circom
// Diseño seguro del commitment
component commitmentHasher = Poseidon(2);
commitmentHasher.inputs[0] <== nullifier;     // Valor privado
commitmentHasher.inputs[1] <== secret;        // Valor privado aleatorio
```

### Consideraciones
- El commitment debe derivarse únicamente de valores privados.
- El secret debe ser verdaderamente aleatorio y tener suficiente entropía.
- La unicidad del commitment es crucial para la privacidad del sistema.

## 5. Validación de relayers

### Diseño seguro
```circom
// Validación segura del relayer
component relayerCheck = IsZero();
relayerCheck.in <== relayer;
signal relayerIsZero <== relayerCheck.out;

component feeZeroCheck = IsZero();
feeZeroCheck.in <== fee;
signal feeIsZero <== feeZeroCheck.out;

// Si fee > 0, entonces relayer no puede ser 0
signal validRelayerConfig <== feeIsZero + (1 - relayerIsZero);
validRelayerConfig >= 1;
```

### Consideraciones
- Previene que las tarifas se envíen a la dirección cero (address(0)).
- Permite operaciones sin relayer al establecer tanto la tarifa como la dirección del relayer a cero.

## 6. Mejores prácticas para SMTVerifier

### Configuración correcta
- **Último hermano a cero**: El último elemento en el array de hermanos (pathElements) DEBE ser cero.
- **Hermano anterior no cero**: Al menos un hermano anterior (generalmente el penúltimo) DEBE ser no cero.
- **Configuración isOld0**: Para pruebas de inclusión con nuevas claves, usa `isOld0 = 1`.

### Evita errores comunes
- Error frecuente: `Assert Failed. Error in template SMTVerifier_157 line: 92`.
- Causado por construcción de ruta inválida, especialmente cuando todos los hermanos son cero o el último hermano no es cero.

## 7. Generación segura de entradas

### Requisitos criptográficos
- Los hashes deben calcularse utilizando la misma implementación de Poseidon en el circuito y en el código de generación de entradas.
- Todas las entradas privadas deben tener suficiente entropía y ser generadas de forma segura.

### Estructura de entrada recomendada
```javascript
const circuitInputs = {
  // Entradas privadas
  secret: generarValorAleatorioSeguro().toString(),
  nullifier: generarValorAleatorioSeguro().toString(),
  pathElements: [...], // Array con pathElement[nLevels-1] = 0 y al menos un elemento anterior no cero
  pathIndices: [...],  // Array de índices de ruta (0=izquierda, 1=derecha)
  
  // Entradas públicas
  root: calcularRaizMerkle(...).toString(),
  nullifierHash: calcularNullifierHash(...).toString(),
  recipient: direccionDestinatario.toString(),
  relayer: direccionRelayer.toString(),
  fee: tarifaRelayer.toString(),
  refund: cantidadReembolso.toString(),
  chainId: idCadena.toString()
};
```

## 8. Eliminación de código obsoleto

Mantén el código limpio eliminando archivos obsoletos:
- `poseidon_old.circom`
- `poseidon_constants_old.circom`
- `pedersen_old.circom`

Esto reduce el riesgo de usar inadvertidamente implementaciones obsoletas o inseguras.

## Implementación de estas directrices

Estas directrices deben aplicarse en todas las etapas del desarrollo de circuitos ZK:
1. **Fase de diseño**: Considerar estas directrices al conceptualizar nuevos circuitos.
2. **Implementación**: Seguir estos patrones al escribir código Circom.
3. **Revisión de código**: Utilizar esta guía como checklist durante las revisiones.
4. **Auditoría**: Solicitar a auditores externos que verifiquen estos aspectos de seguridad.
5. **Mantenimiento**: Revisar y actualizar periódicamente estas directrices basándose en nuevas vulnerabilidades o mejores prácticas. 