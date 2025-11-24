@echo off
echo ========================================
echo   COMPILADOR AUTOMATICO DE APK
echo ========================================
echo.
echo Este script vai tentar compilar o APK
echo usando o Gradle do Android Studio
echo.

REM Procura o Gradle wrapper do Android Studio
set GRADLE_WRAPPER=

if exist "%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\gradle.bat" (
    set GRADLE_WRAPPER=%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\gradle.bat
    goto :found
)

if exist "C:\Program Files\Android\Android Studio\gradle\gradle-8.0\bin\gradle.bat" (
    set GRADLE_WRAPPER=C:\Program Files\Android\Android Studio\gradle\gradle-8.0\bin\gradle.bat
    goto :found
)

REM Tenta usar gradlew.bat se existir
if exist "gradlew.bat" (
    set GRADLE_WRAPPER=gradlew.bat
    goto :found
)

echo ERRO: Nao foi possivel encontrar o Gradle.
echo.
echo SOLUCAO: Abra o Android Studio e compile manualmente:
echo 1. File ^> Open ^> Selecione esta pasta
echo 2. Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo.
pause
exit /b 1

:found
echo Gradle encontrado!
echo Localizacao: %GRADLE_WRAPPER%
echo.
echo Iniciando compilacao...
echo.

REM Limpa builds anteriores
echo [1/3] Limpando builds anteriores...
call "%GRADLE_WRAPPER%" clean

REM Compila o APK debug
echo.
echo [2/3] Compilando APK...
call "%GRADLE_WRAPPER%" assembleDebug

if errorlevel 1 (
    echo.
    echo ERRO NA COMPILACAO!
    echo Verifique os erros acima.
    pause
    exit /b 1
)

REM Localiza o APK gerado
echo.
echo [3/3] APK compilado com sucesso!
echo.
echo Localizacao do APK:
dir /s /b app\build\outputs\apk\debug\*.apk

echo.
echo ========================================
echo   COMPILACAO CONCLUIDA!
echo ========================================
echo.
echo Transfira o APK acima para seu celular
echo e instale (ative Fontes Desconhecidas)
echo.
pause
