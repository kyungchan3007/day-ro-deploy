# syntax=docker/dockerfile:1

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# 의존성 해결을 src 복사보다 먼저 두어, 소스만 바뀐 빌드에서 레이어 캐시가 살아있게 한다
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q || true

COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
WORKDIR /app

# 헬스체크용 curl - temurin 이미지에 기본 포함되어 있지 않다
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# root로 실행하지 않는다
RUN useradd --system --create-home --shell /usr/sbin/nologin dayro
# 로그 디렉터리를 이미지에 dayro 소유로 만들어 둔다.
# compose가 여기에 named volume을 처음 붙일 때 이 소유권을 복사해 가므로, root가 아닌 dayro도 파일을 쓸 수 있다.
RUN mkdir -p /app/logs && chown dayro:dayro /app/logs
COPY --from=build --chown=dayro:dayro /app/build/libs/*.jar app.jar
USER dayro

# 컨테이너에 걸린 메모리 제한을 기준으로 힙을 잡는다.
# 2GiB 서버에 Postgres/Redis/Caddy가 함께 올라가므로 JVM 기본값(가용 메모리의 1/4)에 맡기지 않고 명시한다.
# SerialGC는 코어 수가 적고 힙이 작은 환경에서 G1보다 메모리 오버헤드가 낮다.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC"

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
