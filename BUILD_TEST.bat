@echo off
setlocal

REM Configurar JAVA_HOME
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"

REM Configurar ANDROID_HOME  
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"

REM Adicionar ao PATH
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo ========================================
echo   TESTANDO COMPILACAO MESTRE 3D^&T
echo ========================================
echo.

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.

REM Tentar encontrar Gradle
if exist "gradlew.bat" (
    echo Usando Gradle Wrapper local...
    call gradlew.bat clean assembleDebug
) else if exist "%ANDROID_HOME%\..\.gradle\wrapper\dists" (
    echo Procurando Gradle instalado...
    for /d %%G in ("%USERPROFILE%\.gradle\wrapper\dists\gradle-*") do (
        for /d %%V in ("%%G\*") do (
            if exist "%%V\gradle-*\bin\gradle.bat" (
                echo Encontrado: %%V
                set "GRADLE_HOME=%%V\gradle-*"
                goto :found_gradle
            )
        )
    )
)

echo.
echo ERRO: Gradle nao encontrado!
echo.
echo SOLUCAO: Abra o projeto no Android Studio e execute:
echo   Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo.
pause
exit /b 1

:found_gradle
echo Executando build...
"%GRADLE_HOME%\bin\gradle.bat" clean assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   BUILD CONCLUIDO COM SUCESSO!
    echo ========================================
    echo.
    echo APK gerado em:
    echo   app\build\outputs\apk\debug\app-debug.apk
    echo.
) else (
    echo.
    echo ========================================
    echo   ERRO NO BUILD
    echo ========================================
    echo.
    echo Verifique os erros acima.
    echo.
)

pause
