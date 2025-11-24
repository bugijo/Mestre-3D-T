@echo off
echo Compilando APK do Mestre 3D^&T...
echo.

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java encontrado em: %JAVA_HOME%
echo.

cd /d "%~dp0"

echo Compilando com Gradle...
"C:\Users\WINDOWS 10\Downloads\gradle-9.2.1\bin\gradle.bat" clean assembleDebug

if errorlevel 1 (
    echo.
    echo ERRO na compilacao!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   APK COMPILADO COM SUCESSO!
echo ============================================
echo.
dir /b /s app\build\outputs\apk\debug\*.apk
echo.
echo Transfira o APK acima para seu celular!
pause
