FROM node:16-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache git python3 make g++

# Instalar Circom
RUN npm install -g circom@2.0.5 snarkjs

# Establecer el directorio de trabajo
WORKDIR /app

# Comando por defecto al iniciar el contenedor
CMD ["sh"] 