# syntax=docker/dockerfile:1
#
# Imagem da learnway-api. Dois estágios: o primeiro compila com o JDK completo,
# o segundo carrega só o JRE — a imagem final não leva Maven, código-fonte nem
# ferramentas de build.

########################################################################
# 1. Build
#
# `--platform=$BUILDPLATFORM` faz este estágio rodar SEMPRE na arquitetura de
# quem está construindo (x86 no runner do GitHub), mesmo quando a imagem final
# é ARM. Isso importa muito: a VM Always Free da Oracle é ARM (Ampere A1), e
# compilar com Maven sob emulação QEMU levaria uns 20 minutos. Como bytecode
# Java não tem arquitetura, o jar compilado no x86 roda igual no ARM — só o
# estágio de runtime precisa ser ARM de verdade.
########################################################################
FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# As dependências mudam muito menos que o código. Numa camada separada, um
# commit que só mexe em src/ reaproveita todo o download anterior.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
# Sem testes aqui: o projeto não tem suíte, e o que interessa neste passo é o
# portão de compilação — se o código não compilar, não existe imagem.
RUN mvn -B -DskipTests package

# O fat jar do Spring Boot sabe se separar em camadas por volatilidade
# (dependências → snapshots → loader → aplicação). Assim um deploy que só muda
# o seu código empurra uns 200 kB em vez dos 62 MB inteiros, e o Cloud Run puxa
# menos bytes no cold start.
#
# `jarmode=tools` é a forma atual; `jarmode=layertools` funciona no 3.3 mas já
# avisa que está deprecada.
RUN java -Djarmode=tools -jar target/learnway-api-*.jar \
        extract --layers --destination /build/layers && \
    mv /build/layers/application/*.jar /build/layers/application/app.jar

########################################################################
# 2. Runtime
#
# Sem `--platform`: este estágio assume a plataforma ALVO do build. Rodando
# `--platform linux/arm64` a imagem final sai ARM; sem nada, sai igual à sua
# máquina. O Temurin publica as duas, então o mesmo Dockerfile serve para a
# Oracle (ARM) e para rodar local no x86.
########################################################################
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Rodar como usuário sem privilégio.
RUN useradd --system --uid 10001 --create-home learnway
USER learnway

# As camadas são ACHATADAS de propósito, todas em /app: o Class-Path do
# manifesto aponta para `lib/`, que precisa ficar ao lado do jar. Da camada que
# menos muda para a que mais muda, para o cache do Docker render o máximo.
COPY --from=build --chown=learnway:learnway /build/layers/dependencies/ ./
COPY --from=build --chown=learnway:learnway /build/layers/spring-boot-loader/ ./
COPY --from=build --chown=learnway:learnway /build/layers/snapshot-dependencies/ ./
COPY --from=build --chown=learnway:learnway /build/layers/application/ ./

# MaxRAMPercentage: sem isso a JVM dimensiona o heap pela memória da máquina
# hospedeira, ignora o limite do contêiner e leva OOM kill.
# SerialGC: com 1 vCPU ele bate os coletores paralelos e ainda sobe mais rápido.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"

# Informativo: quem manda de verdade é a variável PORT (ver application.yml).
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
