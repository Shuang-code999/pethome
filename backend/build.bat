@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot"
cd /d "%~dp0"
echo JAVA_HOME=%JAVA_HOME%
call mvn -DskipTests compile
exit /b %ERRORLEVEL%
