@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo   COMPILADOR APK - Mestre 3D^&T
echo ========================================
echo.

REM ===== PARTE 1: Procurar Java =====
echo [1/4] Procurando Java...

set JAVA_CMD=
set GRADLE_CMD=

REM Tenta Android Studio JDK
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_CMD=C:\Program Files\Android\Android Studio\jbr\bin\java.exe"
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    echo Java encontrado no Android Studio!
    goto :java_found
)

REM Tenta localappdata
if exist "%LOCALAPPDATA%\Android\Sdk\jre\bin\java.exe" (
    set "JAVA_CMD=%LOCALAPPDATA%\Android\Sdk\jre\bin\java.exe"
    set "JAVA_HOME=%LOCALAPPDATA%\Android\Sdk\jre"
    echo Java encontrado no Android SDK!
    goto :java_found
)

REM Tenta Program Files
for /d %%i in ("C:\Program Files\Java\jdk*") do (
    if exist "%%i\bin\java.exe" (
        set "JAVA_CMD=%%i\bin\java.exe"
        set "JAVA_HOME=%%i"
        echo Java encontrado em: %%i
        goto :java_found
    )
)

echo ERRO: Java nao encontrado!
echo.
echo Opcoes:
echo 1. Instale o Android Studio (que inclui o Java)
echo 2. Execute este script novamente apos a instalacao
echo.
pause
exit /b 1

:java_found
echo JAVA_HOME=%JAVA_HOME%
echo.

REM ===== PARTE 2: Procurar Gradle =====
echo [2/4] Procurando Gradle...

REM Tenta gradlew local
if exist "gradlew.bat" (
    set GRADLE_CMD=gradlew.bat
    echo Gradle wrapper encontrado!
    goto :gradle_found
)

REM Tenta Gradle em Downloads
for /d %%i in ("%USERPROFILE%\Downloads\gradle-*") do (
    if exist "%%i\bin\gradle.bat" (
        set "GRADLE_CMD=%%i\bin\gradle.bat"
        echo Gradle encontrado em Downloads!
        goto :gradle_found
    )
)

echo AVISO: Gradle nao encontrado.
echo Gerando wrapper do Gradle...
echo.

REM Baixa e cria wrapper
powershell -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.2-all.zip' -OutFile 'gradle-temp.zip'"
powershell -Command "Expand-Archive -Path 'gradle-temp.zip' -DestinationPath '.' -Force"
for /d %%i in ("gradle-*") do set "GRADLE_CMD=%%i\bin\gradle.bat"
del gradle-temp.zip

:gradle_found
echo Gradle: !GRADLE_CMD!
echo.

REM ===== PARTE 3: Criar Wrapper =====
if not exist "gradlew.bat" (
    echo [3/4] Criando Gradle Wrapper...
    call "!GRADLE_CMD!" wrapper --gradle-version 8.2
    if errorlevel 1 (
        echo ERRO ao criar wrapper!
        pause
        exit /b 1
    )
    set GRADLE_CMD=gradlew.bat
)

REM ===== PARTE 4: Compilar APK =====
echo [4/4] Compilando APK...
echo.

REM Limpa build anterior
call !GRADLE_CMD! clean

echo.
echo Compilando APK de debug...
call !GRADLE_CMD! assembleDebug

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO NA COMPILACAO
    echo ========================================
    echo.
    echo Verifique os erros acima.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO!
echo ========================================
echo.
echo APK compilado em:
dir /b /s app\build\outputs\apk\debug\*.apk
echo.
echo Transfira este arquivo para seu celular
echo e instale (ative "Fontes Desconhecidas")
echo.
pause
