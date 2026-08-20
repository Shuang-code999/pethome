@echo off
setlocal
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0"
set "DB_HOST=localhost"
set "DB_PASSWORD=root123"
set "REDIS_HOST=localhost"
set "MQ_HOST=localhost"
set "MQ_USERNAME=pet"
set "MQ_PASSWORD=pet123"
echo JAVA_HOME=%JAVA_HOME%
echo DB_PASSWORD=%DB_PASSWORD% DB_HOST=%DB_HOST%
echo Starting backend at http://localhost:8088/api ...
call mvn -DskipTests org.springframework.boot:spring-boot-maven-plugin:3.3.5:run
