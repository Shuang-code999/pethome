# syntax=docker/dockerfile:1
# 萌宠之家 后端镜像：multi-stage（maven 构建 → jre 运行）

# ---------- 1. 构建阶段 ----------
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# 配置阿里云 Maven 镜像，加速依赖下载（国内服务器必备）
RUN mkdir -p /root/.m2 && cat > /root/.m2/settings.xml <<'EOF'
<settings>
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <name>Aliyun Maven Mirror</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
</settings>
EOF

# 先拷 pom，利用层缓存预下载依赖（src 没拷时 go-offline 可能不完整，容错）
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true

# 拷源码 + 资源（含 lua/ knowledge/ schema.sql application*.yml）
COPY src ./src
RUN mvn -B -DskipTests package

# 统一 jar 名（spring-boot 重打包后只有 pethome-backend-*.jar，.jar.original 不被匹配）
RUN mv target/pethome-backend-*.jar app.jar

# ---------- 2. 运行阶段 ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# 时区（日志/时间显示）
ENV TZ=Asia/Shanghai \
    JAVA_OPTS="-Xms256m -Xmx512m"

COPY --from=builder /build/app.jar app.jar

# 上传目录（运行时挂 named volume 持久化）
RUN mkdir -p /app/uploads
VOLUME /app/uploads

EXPOSE 8088
# sh -c 让 $JAVA_OPTS 生效（堆大小可由 compose 覆盖）
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
